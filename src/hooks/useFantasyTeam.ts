import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type {
  Gameweek,
  Lineup,
  LineupPlayer,
  Formation,
  Card,
  PlayerPosition,
} from '../types/types';
import { VALID_FORMATIONS as FORMATIONS } from '../types/types';

// RG-M02 : Contraintes minimales de formation
const MIN_CONSTRAINTS: Record<PlayerPosition, number> = {
  GK: 1,
  DEF: 3,
  MID: 0,
  FWD: 1,
};

export const useFantasyTeam = (userId: string | undefined) => {
  const [currentGameweek, setCurrentGameweek] = useState<Gameweek | null>(null);
  const [myLineup, setMyLineup] = useState<Lineup | null>(null);
  const [lineupPlayers, setLineupPlayers] = useState<LineupPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger la journee en cours (OPEN ou LIVE)
  useEffect(() => {
    const gameweeksRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'gameweeks');
    const q = query(
      gameweeksRef,
      where('status', 'in', ['OPEN', 'LIVE']),
      orderBy('number', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setCurrentGameweek({ id: docSnap.id, ...docSnap.data() } as Gameweek);
      } else {
        setCurrentGameweek(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Charger le lineup de l'utilisateur pour la journee en cours
  useEffect(() => {
    if (!userId || !currentGameweek) {
      setMyLineup(null);
      setLineupPlayers([]);
      return;
    }

    const lineupRef = doc(
      db,
      'artifacts',
      APP_ID,
      'users',
      userId,
      'lineups',
      currentGameweek.id
    );

    const unsubLineup = onSnapshot(lineupRef, (docSnap) => {
      if (docSnap.exists()) {
        setMyLineup({ id: docSnap.id, ...docSnap.data() } as Lineup);
      } else {
        setMyLineup(null);
      }
    });

    // Charger les joueurs du lineup
    const playersRef = collection(
      db,
      'artifacts',
      APP_ID,
      'users',
      userId,
      'lineups',
      currentGameweek.id,
      'lineup_players'
    );

    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      const players: LineupPlayer[] = [];
      snapshot.forEach((docSnap) => {
        players.push(docSnap.data() as LineupPlayer);
      });
      setLineupPlayers(players.sort((a, b) => a.position_slot - b.position_slot));
    });

    return () => {
      unsubLineup();
      unsubPlayers();
    };
  }, [userId, currentGameweek]);

  /**
   * Valide qu'une formation est correcte avec les joueurs assignes
   * - 11 titulaires obligatoires
   * - Respecte les contraintes de position selon VALID_FORMATIONS
   */
  const validateFormation = useCallback(
    (formation: Formation, players: LineupPlayer[]): { valid: boolean; error?: string } => {
      const starters = players.filter((p) => p.position_slot >= 1 && p.position_slot <= 11);

      if (starters.length !== 11) {
        return { valid: false, error: `11 titulaires requis (actuellement ${starters.length})` };
      }

      const expected = FORMATIONS[formation];
      if (!expected) {
        return { valid: false, error: `Formation invalide: ${formation}` };
      }

      // Compter les positions des joueurs titulaires
      const positionCounts: Record<PlayerPosition, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      for (const player of starters) {
        const pos = player.card.player.position;
        positionCounts[pos]++;
      }

      // Verifier les contraintes de la formation
      for (const pos of ['GK', 'DEF', 'MID', 'FWD'] as PlayerPosition[]) {
        if (positionCounts[pos] !== expected[pos]) {
          return {
            valid: false,
            error: `Formation ${formation} requiert ${expected[pos]} ${pos}, mais ${positionCounts[pos]} assignes`,
          };
        }
      }

      // RG-M02 : Contraintes minimales globales
      if (positionCounts.GK < MIN_CONSTRAINTS.GK) {
        return { valid: false, error: 'Minimum 1 gardien requis' };
      }
      if (positionCounts.DEF < MIN_CONSTRAINTS.DEF) {
        return { valid: false, error: 'Minimum 3 defenseurs requis' };
      }
      if (positionCounts.FWD < MIN_CONSTRAINTS.FWD) {
        return { valid: false, error: 'Minimum 1 attaquant requis' };
      }

      return { valid: true };
    },
    []
  );

  /**
   * RG-M04 : Verifie qu'une carte est disponible (possedee et non verrouillee sur le marche)
   */
  const isCardAvailable = useCallback(
    (cardId: string, userCards: Card[]): boolean => {
      const card = userCards.find((c) => c.id === cardId);
      if (!card) return false;
      if (card.is_locked) return false;
      return true;
    },
    []
  );

  /**
   * Sauvegarde le lineup dans Firestore via une transaction atomique
   * - Valide la formation
   * - Verifie que toutes les cartes sont disponibles (RG-M04)
   * - Sauvegarde le document lineup + sous-collection lineup_players
   * - Passe le statut de DRAFT a SAVED
   */
  const saveLineup = useCallback(
    async (
      gameweekId: string,
      formation: Formation,
      players: LineupPlayer[],
      captainId?: string
    ): Promise<void> => {
      if (!userId) throw new Error('Non connecte');

      // Validation de la formation
      const validation = validateFormation(formation, players);
      if (!validation.valid) {
        throw new Error(validation.error || 'Formation invalide');
      }

      const lineupRef = doc(
        db,
        'artifacts',
        APP_ID,
        'users',
        userId,
        'lineups',
        gameweekId
      );

      await runTransaction(db, async (transaction) => {
        // Lire le lineup existant (s'il existe)
        const lineupDoc = await transaction.get(lineupRef);
        const existingStatus = lineupDoc.exists() ? lineupDoc.data()?.status : null;

        // Ne pas modifier un lineup verrouille
        if (existingStatus === 'LOCKED') {
          throw new Error('Lineup verrouille, modification impossible');
        }

        // Sauvegarder le document principal du lineup
        transaction.set(lineupRef, {
          user_id: userId,
          gameweek_id: gameweekId,
          formation,
          captain_id: captainId || null,
          score_total: lineupDoc.exists() ? (lineupDoc.data()?.score_total || 0) : 0,
          status: 'SAVED',
          updated_at: Date.now(),
        });
      });

      // Sauvegarder les joueurs dans la sous-collection (batch write)
      const batch = writeBatch(db);
      const playersCollRef = collection(
        db,
        'artifacts',
        APP_ID,
        'users',
        userId,
        'lineups',
        gameweekId,
        'lineup_players'
      );

      for (const player of players) {
        const playerDocRef = doc(playersCollRef, player.card_id);
        batch.set(playerDocRef, {
          card_id: player.card_id,
          card: player.card,
          position_slot: player.position_slot,
          is_subbed_in: player.is_subbed_in || false,
        });
      }

      await batch.commit();
    },
    [userId, validateFormation]
  );

  return {
    currentGameweek,
    myLineup,
    lineupPlayers,
    loading,
    saveLineup,
    validateFormation,
    isCardAvailable,
  };
};

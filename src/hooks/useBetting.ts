import { useState, useEffect } from 'react';
import { doc, runTransaction, collection, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { MatchStatus, PredictionType } from "../types/types";

// RG-A03 & RG-B02 : Coûts et gains (Mode Forfait pour l'instant)
const RULES = {
  COST: 100,
  GAINS: {
    '1N2': 200,
    'EXACT_SCORE': 1000,
    'PENALTY_MISS': 500
  } as Record<string, number>
};

export const useBetting = (userId: string | undefined, matchId: string | undefined, matchStatus: MatchStatus | undefined) => {
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<any[]>([]);

  // Helpers pour RG-A01 et RG-A02
  // RG-A01: Verrouillage 1N2 à la seconde du coup d'envoi
  const is1N2Locked = (): boolean => {
    if (!matchStatus) return false;
    return matchStatus !== 'PRE_MATCH';
  };

  // RG-A02: Score Exact modifiable jusqu'au coup d'envoi MT2
  const isScoreLocked = (): boolean => {
    if (!matchStatus) return false;
    return ['LIVE_2ND_HALF', 'FINISHED'].includes(matchStatus);
  };

  // Message d'avertissement selon le statut
  const getLockMessage = (type: PredictionType): string | null => {
    if (type === '1N2' && is1N2Locked()) {
      return "⚠️ Paris 1N2 fermés (match commencé)";
    }
    if (type === 'EXACT_SCORE' && isScoreLocked()) {
      return "⚠️ Paris Score fermés (2ème mi-temps commencée)";
    }
    if (type === 'EXACT_SCORE' && matchStatus === 'LIVE_1ST_HALF') {
      return "ℹ️ Modifiable jusqu'à la mi-temps";
    }
    return null;
  };

  // Chargement des pronos (RG-A04: Stats publiques à ajouter plus tard via agrégation)
  useEffect(() => {
    if (!userId || !matchId) return;
    const q = collection(db, 'artifacts', APP_ID, 'users', userId, 'predictions');
    const unsub = onSnapshot(q, (snapshot) => {
      const active: Record<string, any> = {};
      const hist: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as any;
        if (data.status === 'PENDING' && data.matchId === matchId) {
          active[data.type as string] = data;
        }
        hist.push(data);
      });
      setPredictions(active);
      setHistory(hist.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsub();
  }, [userId, matchId]);

  /**
   * Place un pari
   * @param type - Type de pari ('1N2' | 'EXACT_SCORE')
   * @param selection - Sélection ('1', 'N', '2' pour 1N2, '2-1' pour score exact)
   * @param amount - Montant de la mise (variable selon SFD Flux B)
   * @param odd - Cote optionnelle pour calcul gain potentiel
   */
  const placeBet = async (
    type: PredictionType,
    selection: string,
    amount: number,
    odd?: { label: string; val: number } | null
  ): Promise<void> => {
    if (!userId) throw new Error("Non connecté");
    if (!matchId) throw new Error("Match non sélectionné");
    if (amount <= 0) throw new Error("Mise invalide");

    // Application RG-A01 & RG-A02
    if (type === '1N2' && is1N2Locked()) {
      throw new Error("Paris 1N2 fermés (Match commencé)");
    }
    if (type === 'EXACT_SCORE' && isScoreLocked()) {
      throw new Error("Paris Score fermés (2ème MT commencée)");
    }

    const predictionId = `${matchId}_${type}`;
    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');
    const predRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'predictions', predictionId);

    await runTransaction(db, async (t) => {
      const userDoc = await t.get(userRef);
      const predDoc = await t.get(predRef);

      const currentCoins = userDoc.data()?.coins || 0;
      const isUpdate = predDoc.exists();
      const previousStake = isUpdate ? (predDoc.data()?.amount || 0) : 0;

      // SFD Flux B: Transaction Atomique
      // 1. Calcul du solde après remboursement éventuel
      const balanceAfterRefund = currentCoins + previousStake;

      // 2. Vérification du solde total disponible
      if (balanceAfterRefund < amount) {
        throw new Error(`Solde insuffisant pour cette mise (disponible: ${balanceAfterRefund}, requis: ${amount})`);
      }

      // 3. Calcul du nouveau solde: Remboursement - Nouvelle mise
      const newBalance = balanceAfterRefund - amount;
      t.update(userRef, { coins: newBalance });

      // Calcul du gain potentiel
      const potentialGain = odd
        ? Math.floor(amount * odd.val)
        : Math.floor(amount * (RULES.GAINS[type] / RULES.COST));

      t.set(predRef, {
        type,
        selection,
        amount, // Mise variable
        potentialGain,
        odd: odd?.val || null,
        timestamp: Date.now(),
        matchId,
        status: 'PENDING'
      });
    });
  };

  // ============================================
  // MODULE B: MOTEUR DE RÉSOLUTION (RG-B01 à RG-B03)
  // ============================================

  /**
   * RG-B01: Détermine le vainqueur final du match
   * Le résultat final inclut prolongations + TAB si applicable
   * @returns '1' (home), 'N' (draw - temps réglementaire), '2' (away)
   */
  const determineWinner = (
    score: { h: number; a: number },
    hadPenaltyShootout: boolean = false,
    penaltyScore: { h: number; a: number } | null = null
  ): '1' | 'N' | '2' => {
    // Si match avec TAB, le vainqueur est celui qui gagne aux TAB
    if (hadPenaltyShootout && penaltyScore) {
      return penaltyScore.h > penaltyScore.a ? '1' : '2';
    }
    // Sinon, résultat du temps réglementaire (+ prolongations si incluses)
    if (score.h > score.a) return '1';
    if (score.a > score.h) return '2';
    return 'N';
  };

  /**
   * RG-B02: Calcule le gain selon le mode de la compétition
   * - ODDS_MULTIPLIER: mise × cote
   * - FIXED: points fixes définis par compétition
   */
  const calculateGain = (
    prediction: {
      type: PredictionType;
      amount: number;
      odd: number | null;
    },
    competitionRules: {
      calculation_mode: 'ODDS_MULTIPLIER' | 'FIXED';
      points_correct_1n2: number | null;
      points_correct_score: number | null;
    }
  ): number => {
    if (competitionRules.calculation_mode === 'FIXED') {
      // Mode FIXED: points définis par la compétition
      if (prediction.type === '1N2') {
        return competitionRules.points_correct_1n2 || RULES.GAINS['1N2'];
      }
      if (prediction.type === 'EXACT_SCORE') {
        return competitionRules.points_correct_score || RULES.GAINS['EXACT_SCORE'];
      }
      return RULES.GAINS[prediction.type] || 0;
    } else {
      // Mode ODDS_MULTIPLIER: mise × cote
      if (prediction.odd) {
        return Math.floor(prediction.amount * prediction.odd);
      }
      // Fallback si pas de cote
      return RULES.GAINS[prediction.type] || 0;
    }
  };

  /**
   * RG-B03: Résout un pari et calcule le statut final
   * Gère les cas: WON, LOST, VOID (annulé si TAB non tiré, etc.)
   */
  const resolveBet = (
    prediction: {
      type: PredictionType;
      selection: string;
      amount: number;
      odd: number | null;
    },
    match: {
      score: { h: number; a: number };
      hadPenaltyShootout: boolean;
      penaltyScore: { h: number; a: number } | null;
      competition: string;
    },
    competitionRules: {
      calculation_mode: 'ODDS_MULTIPLIER' | 'FIXED';
      points_correct_1n2: number | null;
      points_correct_score: number | null;
      include_extra_time: boolean;
    }
  ): { status: 'WON' | 'LOST' | 'VOID'; gain: number; reason?: string } => {
    const winner = determineWinner(match.score, match.hadPenaltyShootout, match.penaltyScore);
    const finalScore = `${match.score.h}-${match.score.a}`;

    // Gestion du type 1N2
    if (prediction.type === '1N2') {
      // Cas spécial: TAB a lieu mais le pari était sur 'N' (nul temps réglementaire)
      if (match.hadPenaltyShootout && prediction.selection === 'N') {
        // En phase finale avec TAB, un "N" au temps réglementaire est généralement VOID
        // car le match continue en prolongations
        return { status: 'VOID', gain: prediction.amount, reason: 'Match avec prolongations/TAB' };
      }

      if (prediction.selection === winner) {
        const gain = calculateGain(prediction, competitionRules);
        return { status: 'WON', gain };
      } else {
        return { status: 'LOST', gain: 0 };
      }
    }

    // Gestion du type EXACT_SCORE
    if (prediction.type === 'EXACT_SCORE') {
      // Le score exact compare avec le score final (temps réglementaire ou avec prolongations selon règles)
      if (prediction.selection === finalScore) {
        const gain = calculateGain(prediction, competitionRules);
        return { status: 'WON', gain };
      } else {
        return { status: 'LOST', gain: 0 };
      }
    }

    // Gestion du type PENALTY_MISS (si implémenté)
    if (prediction.type === 'PENALTY_MISS') {
      // RG-B03: Annulé si le joueur désigné n'a pas tiré
      // Pour l'instant, on retourne VOID car la logique dépend des événements du match
      return { status: 'VOID', gain: prediction.amount, reason: 'Résolution PENALTY_MISS non implémentée' };
    }

    return { status: 'LOST', gain: 0 };
  };

  // Helper pour vérifier si un pari existe déjà pour ce match/type
  const getExistingBet = (type: PredictionType) => {
    return predictions[type] || null;
  };

  return {
    predictions,
    history,
    placeBet,
    is1N2Locked,
    isScoreLocked,
    getLockMessage,
    getExistingBet,
    RULES,
    // Module B exports
    determineWinner,
    calculateGain,
    resolveBet
  };
};
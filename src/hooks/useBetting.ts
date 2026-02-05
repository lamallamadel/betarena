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
   * @param amount - Montant de la mise (utilisé pour l'affichage, le coût réel est RULES.COST)
   * @param odd - Cote optionnelle pour calcul gain potentiel
   */
  const placeBet = async (
    type: PredictionType,
    selection: string,
    _amount: number,
    odd?: { label: string; val: number } | null
  ): Promise<void> => {
    if (!userId) throw new Error("Non connecté");
    if (!matchId) throw new Error("Match non sélectionné");

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
      const isUpdate = predDoc.exists(); // RG-A03: Si update, on a déjà payé

      // Flux Alternatif : Solde insuffisant
      if (!isUpdate && currentCoins < RULES.COST) {
        throw new Error("Coins insuffisants");
      }

      // RG-A03 : Débit immédiat
      if (!isUpdate) {
        t.update(userRef, { coins: currentCoins - RULES.COST });
      }

      // Calcul du gain potentiel
      const potentialGain = odd
        ? Math.floor(RULES.COST * odd.val)
        : RULES.GAINS[type] || 0;

      t.set(predRef, {
        type,
        selection,
        amount: RULES.COST,
        potentialGain,
        odd: odd?.val || null,
        timestamp: Date.now(),
        matchId,
        status: 'PENDING'
      });
    });
  };

  return {
    predictions,
    history,
    placeBet,
    is1N2Locked,
    isScoreLocked,
    getLockMessage,
    RULES
  };
};
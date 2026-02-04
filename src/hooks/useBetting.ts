import { useState, useEffect } from 'react';
import { doc, runTransaction, collection, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type {MatchStatus, PredictionType} from "../types/types.ts";

// RG-A03 & RG-B02 : Coûts et gains (Mode Forfait pour l'instant)
const RULES = {
  COST: 100,
  GAINS: {
    '1N2': 200,
    'EXACT_SCORE': 1000,
    'PENALTY_MISS': 500
  }
};

export const useBetting = (userId: string | undefined, matchId: string, matchStatus: MatchStatus) => {
  const [predictions, setPredictions] = useState<Record<string, never>>({});
  const [history, setHistory] = useState<[]>([]);

  // Helpers pour RG-A01 et RG-A02
  const is1N2Locked = () => matchStatus !== 'PRE_MATCH';
  const isScoreLocked = () => ['LIVE_2ND_HALF', 'FINISHED'].includes(matchStatus);

  // Chargement des pronos (RG-A04: Stats publiques à ajouter plus tard via agrégation)
  useEffect(() => {
    if (!userId) return;
    const q = collection(db, 'artifacts', APP_ID, 'users', userId, 'predictions');
    const unsub = onSnapshot(q, (snapshot) => {
      const active: Record<string, never> = {};
      const hist: never[] = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        // @ts-ignore
        if (data.status === 'PENDING' && data.matchId === matchId) {
          // @ts-ignore
          active[data.type] = data;
        }
        // @ts-ignore
        hist.push(data);
      });
      setPredictions(active);
      // @ts-ignore
      setHistory(hist.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsub();
  }, [userId, matchId]);

  const placeBet = async (s: string, type1: "home" | "draw" | "away", amount: number) => {
    if (!userId) throw new Error("Non connecté");

    // Application RG-A01 & RG-A02
    if (type === '1N2' && is1N2Locked()) throw new Error("Paris 1N2 fermés (Match commencé)");
    if (type === 'EXACT_SCORE' && isScoreLocked()) throw new Error("Paris Score fermés (2ème MT commencée)");

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

      t.set(predRef, {
        type, selection,
        amount: RULES.COST,
        potentialGain: RULES.GAINS[type] || 0,
        timestamp: Date.now(),
        matchId,
        status: 'PENDING'
      });
    });
  };

  return { predictions, history, placeBet, is1N2Locked, isScoreLocked, RULES };
};
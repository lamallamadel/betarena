import { useState, useEffect } from 'react';
import { doc, runTransaction, updateDoc, increment } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

const MAX_DAILY_SHARES = 3;
const SHARE_REWARD = 10;
const XP_PER_LEVEL = 1000;
const BONUS_COOLDOWN = 10000; // 10 secondes pour le test (mets 86400000 pour 24h)

export const useGamification = (userId: string | undefined, profile: any) => {
  // 1. État local pour l'heure actuelle (se met à jour chaque seconde)
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Ce timer force le hook à se rafraîchir toutes les secondes
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Calcul dynamique basé sur 'now'
  const timeSinceLast = profile ? now - (profile.lastDailyBonus || 0) : 0;
  const isBonusAvailable = profile ? timeSinceLast > BONUS_COOLDOWN : false;

  // Calculs d'affichage
  const getLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
  const getProgress = (xp: number) => (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  // Action : Acheter
  const buyItem = async (cost: number, itemId: string) => {
    if (!userId || !profile) return;
    if (profile.coins < cost) throw new Error("Pas assez de coins !");
    if (profile.inventory?.includes(itemId)) throw new Error("Déjà possédé !");

    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');
    await updateDoc(userRef, {
      coins: increment(-cost),
      inventory: [...(profile.inventory || []), itemId]
    });
  };

  // Action : Réclamer Bonus
  const claimBonus = async () => {
    if (!userId || !profile) return;

    // Vérification de sécurité
    if (!isBonusAvailable) {
      const secondsLeft = Math.ceil((BONUS_COOLDOWN - timeSinceLast) / 1000);
      throw new Error(`Patience ! Encore ${secondsLeft} secondes.`);
    }

    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');
    await updateDoc(userRef, {
      coins: increment(100),
      xp: increment(50),
      lastDailyBonus: Date.now() // On enregistre l'heure du clic
    });
    // On met à jour 'now' immédiatement pour que le bouton se grise tout de suite
    setNow(Date.now());
  };

  // Action : Partage
  const claimShareReward = async () => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');

    await runTransaction(db, async (t) => {
      const docSnap = await t.get(userRef);
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      let newCount = data.dailyShareCount || 0;
      if (data.lastShareDate !== today) newCount = 0;

      if (newCount < MAX_DAILY_SHARES) {
        t.update(userRef, {
          coins: increment(SHARE_REWARD),
          dailyShareCount: newCount + 1,
          lastShareDate: today
        });
      }
    });
  };

  return { getLevel, getProgress, buyItem, claimBonus, claimShareReward, isBonusAvailable };
};
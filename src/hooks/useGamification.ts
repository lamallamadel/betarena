import { useState, useEffect } from 'react';
import { doc, runTransaction, updateDoc, increment } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

const MAX_DAILY_SHARES = 3;
const SHARE_REWARD = 10;
// RG-E02: XP exponentielle: seuil = 100 × Level^1.5
const getXpForLevel = (level: number): number => Math.floor(100 * Math.pow(level, 1.5));
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

  // Calculs d'affichage (RG-E02: courbe exponentielle)
  const getLevel = (xp: number) => {
    let level = 1;
    let totalXpNeeded = 0;
    while (totalXpNeeded + getXpForLevel(level) <= xp) {
      totalXpNeeded += getXpForLevel(level);
      level++;
    }
    return level;
  };
  const getProgress = (xp: number) => {
    let level = 1;
    let totalXpNeeded = 0;
    while (totalXpNeeded + getXpForLevel(level) <= xp) {
      totalXpNeeded += getXpForLevel(level);
      level++;
    }
    const xpInCurrentLevel = xp - totalXpNeeded;
    const xpForNextLevel = getXpForLevel(level);
    return (xpInCurrentLevel / xpForNextLevel) * 100;
  };

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

  // Action : Équiper
  const equipItem = async (type: 'AVATAR' | 'FRAME', asset: string) => {
    if (!userId) return;
    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');

    const updateData = type === 'AVATAR' ? { avatar: asset } : { frame: asset };
    await updateDoc(userRef, updateData);
  };

  // Action : Réclamer Bonus
  const claimBonus = async () => {
    if (!userId || !profile) return;

    // Vérification de sécurité
    if (!isBonusAvailable) {
      const secondsLeft = Math.ceil((BONUS_COOLDOWN - timeSinceLast) / 1000);
      throw new Error(`Patience ! Encore ${secondsLeft} secondes.`);
    }

    // RG-E01: Bonus 200 coins si solde < 50 (mécanique comeback), sinon 100
    const bonusAmount = (profile.coins || 0) < 50 ? 200 : 100;

    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');
    await updateDoc(userRef, {
      coins: increment(bonusAmount),
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

  return { getLevel, getProgress, buyItem, equipItem, claimBonus, claimShareReward, isBonusAvailable };
};
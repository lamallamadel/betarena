import { useState, useEffect } from 'react';
import { doc, runTransaction, updateDoc, increment, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { Bottom50RetentionData, UserActivitySnapshot } from '../types/types';

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

  // ============================================
  // ANALYTICS: Bottom 50% Retention (Year 5)
  // ============================================

  /**
   * Calcule et enregistre les métriques de rétention du bottom 50%
   * Mesure l'engagement des utilisateurs les moins performants du classement
   * Indicateur clé de santé de l'écosystème (éviter la churn des débutants)
   */
  const trackBottom50Retention = async (): Promise<void> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayStart = new Date(today).getTime();
      const dayEnd = dayStart + 86400000; // +24h

      // 1. Récupérer le classement complet depuis la collection leaderboard
      const leaderboardRef = collection(db, 'leaderboard');
      const leaderboardQuery = query(leaderboardRef, orderBy('totalCoins', 'desc'));
      const leaderboardSnapshot = await getDocs(leaderboardQuery);

      const totalUsers = leaderboardSnapshot.size;
      if (totalUsers === 0) return;

      const bottom50Count = Math.ceil(totalUsers / 2);
      const allUsers: Array<{ userId: string; rank: number; coins: number }> = [];

      leaderboardSnapshot.docs.forEach((doc, index) => {
        allUsers.push({
          userId: doc.id,
          rank: index + 1,
          coins: doc.data().totalCoins || 0
        });
      });

      // 2. Identifier les utilisateurs du bottom 50%
      const bottom50Users = allUsers.slice(-bottom50Count);

      // 3. Calculer l'activité du bottom 50% pour la journée
      let activeBottom50 = 0;
      let totalBetsPlaced = 0;
      let totalCoinsSpent = 0;
      const activitySnapshots: UserActivitySnapshot[] = [];

      for (const user of bottom50Users) {
        const predictionsRef = collection(db, 'artifacts', APP_ID, 'users', user.userId, 'predictions');
        const predictionsSnapshot = await getDocs(predictionsRef);

        let userBets = 0;
        let userCoinsSpent = 0;
        let lastActiveAt = 0;

        predictionsSnapshot.forEach((predDoc) => {
          const data = predDoc.data();
          const timestamp = data.timestamp || 0;

          // Compter uniquement l'activité de la journée
          if (timestamp >= dayStart && timestamp < dayEnd) {
            userBets++;
            userCoinsSpent += data.amount || 0;
            lastActiveAt = Math.max(lastActiveAt, timestamp);
          }
        });

        if (userBets > 0) {
          activeBottom50++;
          totalBetsPlaced += userBets;
          totalCoinsSpent += userCoinsSpent;
        }

        activitySnapshots.push({
          userId: user.userId,
          rank: user.rank,
          isBottom50: true,
          betsPlaced: userBets,
          coinsSpent: userCoinsSpent,
          lastActiveAt
        });
      }

      // 4. Calculer les métriques agrégées
      const retentionRate = bottom50Count > 0 ? (activeBottom50 / bottom50Count) * 100 : 0;
      const avgBetsPerUser = activeBottom50 > 0 ? totalBetsPlaced / activeBottom50 : 0;
      const avgCoinsSpent = activeBottom50 > 0 ? totalCoinsSpent / activeBottom50 : 0;

      const retentionData: Bottom50RetentionData = {
        date: today,
        timestamp: Date.now(),
        totalUsers,
        bottom50Count,
        activeBottom50,
        retentionRate,
        avgBetsPerUser,
        avgCoinsSpent
      };

      // 5. Stockage dans Firestore
      const analyticsRef = doc(
        db,
        'artifacts',
        APP_ID,
        'analytics',
        'bottom50_retention',
        'daily',
        today
      );
      await setDoc(analyticsRef, retentionData);

      // Stockage optionnel des snapshots détaillés pour analyse future
      const snapshotsRef = doc(
        db,
        'artifacts',
        APP_ID,
        'analytics',
        'bottom50_retention',
        'snapshots',
        today
      );
      await setDoc(snapshotsRef, {
        date: today,
        timestamp: Date.now(),
        snapshots: activitySnapshots.filter(s => s.betsPlaced > 0) // Sauver seulement les actifs
      });

      console.log('[Analytics] Bottom 50% Retention tracked:', {
        date: today,
        retentionRate: retentionRate.toFixed(2) + '%',
        activeBottom50,
        bottom50Count
      });
    } catch (error) {
      console.error('[Analytics] Error tracking bottom 50% retention:', error);
    }
  };

  return { 
    getLevel, 
    getProgress, 
    buyItem, 
    equipItem, 
    claimBonus, 
    claimShareReward, 
    isBonusAvailable,
    // Analytics exports
    trackBottom50Retention
  };
};
import { collection, getDocs, query, where, orderBy, setDoc, doc } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { ChampionVarianceData, Bottom50RetentionData, UserActivitySnapshot, PredictionType } from '../types/types';

/**
 * Hook dédié aux analytics Year 5
 * Fournit des métriques avancées pour les features futures:
 * - Champion Variance: Distribution des paris
 * - Bottom 50% Retention: Engagement des utilisateurs moins performants
 */
export const useAnalytics = () => {
  // ============================================
  // CHAMPION VARIANCE
  // ============================================

  /**
   * Calcule et enregistre les métriques de variance de champion
   * Champion Variance mesure la distribution des paris entre les utilisateurs
   * 
   * Métriques clés:
   * - varianceScore: 0 (concentré) à 1 (diversifié) - Entropie de Shannon
   * - concentrationIndex: 0 (diversifié) à 1 (concentré) - Herfindahl-Hirschman Index
   * 
   * @param matchId - ID du match à analyser
   * @param predictionType - Type de prédiction ('1N2' | 'EXACT_SCORE' | 'PENALTY_MISS')
   */
  const trackChampionVariance = async (
    matchId: string,
    predictionType: PredictionType = '1N2'
  ): Promise<ChampionVarianceData | null> => {
    if (!matchId) return null;

    try {
      // Agrégation de tous les paris pour ce match/type
      const allUsersRef = collection(db, 'artifacts', APP_ID, 'users');
      const usersSnapshot = await getDocs(allUsersRef);

      const betsBySelection: Record<string, { count: number; totalStaked: number; users: Set<string> }> = {};
      let totalBets = 0;
      const uniqueUsers = new Set<string>();

      // Parcourir tous les utilisateurs et leurs prédictions
      for (const userDoc of usersSnapshot.docs) {
        const predictionsRef = collection(db, 'artifacts', APP_ID, 'users', userDoc.id, 'predictions');
        const predQuery = query(
          predictionsRef,
          where('matchId', '==', matchId),
          where('type', '==', predictionType),
          where('status', '==', 'PENDING')
        );
        const predSnapshot = await getDocs(predQuery);

        predSnapshot.forEach((predDoc) => {
          const data = predDoc.data();
          const selection = data.selection as string;
          const amount = data.amount || 0;

          if (!betsBySelection[selection]) {
            betsBySelection[selection] = { count: 0, totalStaked: 0, users: new Set() };
          }

          betsBySelection[selection].count++;
          betsBySelection[selection].totalStaked += amount;
          betsBySelection[selection].users.add(userDoc.id);
          totalBets++;
          uniqueUsers.add(userDoc.id);
        });
      }

      if (totalBets === 0) return null;

      // Calcul des métriques
      const selections = Object.entries(betsBySelection).map(([selection, data]) => ({
        selection,
        count: data.count,
        percentage: (data.count / totalBets) * 100,
        totalStaked: data.totalStaked
      }));

      // Variance Score: Utilise l'entropie de Shannon normalisée
      // Score de 0 (tous les paris sur une option) à 1 (distribution parfaitement uniforme)
      const numOptions = selections.length;
      let entropy = 0;
      selections.forEach((sel) => {
        const p = sel.percentage / 100;
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
      });
      const maxEntropy = numOptions > 1 ? Math.log2(numOptions) : 1;
      const varianceScore = maxEntropy > 0 ? entropy / maxEntropy : 0;

      // Concentration Index: Herfindahl-Hirschman Index (HHI)
      // 0 = parfaitement diversifié, 1 = totalement concentré
      const concentrationIndex = selections.reduce((sum, sel) => {
        const marketShare = sel.percentage / 100;
        return sum + marketShare * marketShare;
      }, 0);

      const analyticsData: ChampionVarianceData = {
        matchId,
        timestamp: Date.now(),
        totalBets,
        uniqueUsers: uniqueUsers.size,
        selections,
        varianceScore,
        concentrationIndex
      };

      // Stockage dans Firestore
      const analyticsRef = doc(
        db,
        'artifacts',
        APP_ID,
        'analytics',
        'champion_variance',
        'matches',
        `${matchId}_${predictionType}`
      );
      await setDoc(analyticsRef, analyticsData);

      console.log('[Analytics] Champion Variance tracked:', {
        matchId,
        type: predictionType,
        varianceScore: varianceScore.toFixed(3),
        concentrationIndex: concentrationIndex.toFixed(3),
        uniqueUsers: uniqueUsers.size,
        totalBets
      });

      return analyticsData;
    } catch (error) {
      console.error('[Analytics] Error tracking champion variance:', error);
      return null;
    }
  };

  // ============================================
  // BOTTOM 50% RETENTION
  // ============================================

  /**
   * Calcule et enregistre les métriques de rétention du bottom 50%
   * Mesure l'engagement des utilisateurs les moins performants du classement
   * Indicateur clé de santé de l'écosystème (éviter la churn des débutants)
   * 
   * Métriques clés:
   * - retentionRate: % du bottom 50% qui a placé au moins 1 pari aujourd'hui
   * - avgBetsPerUser: Nombre moyen de paris par utilisateur actif
   * - avgCoinsSpent: Dépense moyenne en coins par utilisateur actif
   * 
   * @param date - Date au format YYYY-MM-DD (optionnel, défaut: aujourd'hui)
   */
  const trackBottom50Retention = async (date?: string): Promise<Bottom50RetentionData | null> => {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const dayStart = new Date(today).getTime();
      const dayEnd = dayStart + 86400000; // +24h

      // 1. Récupérer le classement complet depuis la collection leaderboard
      const leaderboardRef = collection(db, 'leaderboard');
      const leaderboardQuery = query(leaderboardRef, orderBy('totalCoins', 'desc'));
      const leaderboardSnapshot = await getDocs(leaderboardQuery);

      const totalUsers = leaderboardSnapshot.size;
      if (totalUsers === 0) return null;

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
      const activeSnapshots = activitySnapshots.filter(s => s.betsPlaced > 0);
      if (activeSnapshots.length > 0) {
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
          snapshots: activeSnapshots
        });
      }

      console.log('[Analytics] Bottom 50% Retention tracked:', {
        date: today,
        retentionRate: retentionRate.toFixed(2) + '%',
        activeBottom50,
        bottom50Count,
        avgBetsPerUser: avgBetsPerUser.toFixed(2),
        avgCoinsSpent: avgCoinsSpent.toFixed(2)
      });

      return retentionData;
    } catch (error) {
      console.error('[Analytics] Error tracking bottom 50% retention:', error);
      return null;
    }
  };

  // ============================================
  // BATCH ANALYTICS
  // ============================================

  /**
   * Exécute tous les analytics pour la journée
   * Fonction utilitaire pour déclencher tous les trackings en une seule fois
   * 
   * @param activeMatchIds - Liste des IDs de matchs actifs à analyser
   */
  const trackDailyAnalytics = async (activeMatchIds: string[] = []): Promise<{
    championVariance: number;
    bottom50Retention: Bottom50RetentionData | null;
  }> => {
    console.log('[Analytics] Starting daily analytics tracking...');

    // 1. Track Champion Variance pour tous les matchs actifs
    let championVarianceCount = 0;
    for (const matchId of activeMatchIds) {
      const result = await trackChampionVariance(matchId, '1N2');
      if (result) championVarianceCount++;
    }

    // 2. Track Bottom 50% Retention
    const retentionData = await trackBottom50Retention();

    console.log('[Analytics] Daily analytics complete:', {
      championVarianceTracked: championVarianceCount,
      retentionTracked: retentionData ? 'Yes' : 'No'
    });

    return {
      championVariance: championVarianceCount,
      bottom50Retention: retentionData
    };
  };

  return {
    trackChampionVariance,
    trackBottom50Retention,
    trackDailyAnalytics
  };
};

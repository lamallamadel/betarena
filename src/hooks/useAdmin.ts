import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, addDoc, where, orderBy, limit, serverTimestamp, increment, onSnapshot, setDoc } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { Environment, FeatureFlagsConfig, EnvironmentConfig } from '../types/types';

interface AdminLog {
    id?: string;
    adminId: string;
    adminName: string;
    action: 'MATCH_OVERRIDE' | 'USER_CREDIT' | 'USER_BAN' | 'PUSH_SENT';
    targetId: string;
    diff: Record<string, unknown>;
    timestamp: unknown;
    ipAddress?: string;
}

interface OverrideData {
    matchId: string;
    newScore: { home: number; away: number };
    lockFromApi: boolean;
    strategy: 'ROLLBACK' | 'HOUSE_LOSS';
}

interface AdminMatch {
    id: string;
    homeTeam: string;
    awayTeam: string;
    score: { home: number | null; away: number | null };
    status: string;
    source: 'API' | 'MANUAL';
    isLocked: boolean;
    betsCount: number;
    date: string;
}

export interface ApiDailyStats {
    date: string;
    total_calls: number;
    successful_calls: number;
    failed_calls: number;
    total_response_time: number;
    last_remaining?: number;
    last_limit?: number;
    last_updated?: unknown;
}

export interface ApiQuotaData {
    dailyStats: ApiDailyStats[];
    currentQuota: {
        remaining: number;
        limit: number;
        used: number;
        usagePercent: number;
    };
    loading: boolean;
}

export const useAdmin = (adminUser: { uid: string; name: string; role: string } | null) => {
    const [matches, setMatches] = useState<AdminMatch[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch matches from Firestore
    const fetchMatches = async () => {
        setLoading(true);
        try {
            const matchesQuery = query(
                collection(db, 'artifacts', APP_ID, 'public', 'data', 'matches'),
                orderBy('date', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(matchesQuery);
            const matchData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AdminMatch[];
            setMatches(matchData);
        } catch (err) {
            console.error('[Admin] Error fetching matches:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch admin logs
    const fetchLogs = async () => {
        try {
            const logsQuery = query(
                collection(db, 'artifacts', APP_ID, 'public', 'data', 'admin_logs'),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(logsQuery);
            const logData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AdminLog[];
            setLogs(logData);
        } catch (err) {
            console.error('[Admin] Error fetching logs:', err);
        }
    };

    // Log admin action
    const logAction = async (action: AdminLog['action'], targetId: string, diff: Record<string, unknown>) => {
        if (!adminUser) return;

        try {
            await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'admin_logs'), {
                adminId: adminUser.uid,
                adminName: adminUser.name,
                action,
                targetId,
                diff,
                timestamp: serverTimestamp()
            });
            // Refresh logs
            fetchLogs();
        } catch (err) {
            console.error('[Admin] Error logging action:', err);
        }
    };

    // Override match score
    const overrideMatch = async (data: OverrideData): Promise<boolean> => {
        if (!adminUser) {
            setError('Non authentifié');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', data.matchId);

            // Get current match data for logging
            const oldScore = matches.find(m => m.id === data.matchId)?.score;

            // Update match
            await updateDoc(matchRef, {
                'score.home': data.newScore.home,
                'score.away': data.newScore.away,
                'isLocked': data.lockFromApi,
                'source': 'MANUAL',
                'status': 'FINISHED',
                'lastModifiedBy': adminUser.uid,
                'lastModifiedAt': serverTimestamp()
            });

            // Log the action
            await logAction('MATCH_OVERRIDE', data.matchId, {
                oldScore: oldScore ? `${oldScore.home}-${oldScore.away}` : 'N/A',
                newScore: `${data.newScore.home}-${data.newScore.away}`,
                strategy: data.strategy,
                locked: data.lockFromApi
            });

            // RG-G03: Process bets based on strategy
            const usersSnap = await getDocs(collection(db, 'artifacts', APP_ID, 'users'));

            for (const userDoc of usersSnap.docs) {
                const predictionsRef = collection(db, 'artifacts', APP_ID, 'users', userDoc.id, 'predictions');
                const betsQuery = query(predictionsRef, where('matchId', '==', data.matchId));
                const betsSnap = await getDocs(betsQuery);

                for (const betDoc of betsSnap.docs) {
                    const bet = betDoc.data();
                    const newScore = `${data.newScore.home}-${data.newScore.away}`;
                    const newWinner = data.newScore.home > data.newScore.away ? '1' : data.newScore.home < data.newScore.away ? '2' : 'N';

                    const isWinnerNow = (bet.type === '1N2' && bet.selection === newWinner) ||
                                        (bet.type === 'EXACT_SCORE' && bet.selection === newScore);

                    const profileRef = doc(db, 'artifacts', APP_ID, 'users', userDoc.id, 'data', 'profile');

                    if (data.strategy === 'ROLLBACK') {
                      // ROLLBACK: annuler anciens gains, recalculer sur nouveau score
                      if (bet.status === 'WON') {
                        // Débiter l'ancien gain
                        await updateDoc(profileRef, { coins: increment(-(bet.gain || 0)) });
                      }
                      if (isWinnerNow) {
                        const gain = bet.potentialGain || bet.amount * 2;
                        await updateDoc(betDoc.ref, { status: 'WON', gain, resolvedAt: Date.now() });
                        await updateDoc(profileRef, { coins: increment(gain) });
                      } else if (bet.status === 'WON') {
                        await updateDoc(betDoc.ref, { status: 'LOST', gain: 0, resolvedAt: Date.now() });
                      }
                    } else {
                      // HOUSE_LOSS: garder anciens gagnants, créditer nouveaux aussi
                      if (isWinnerNow && bet.status !== 'WON') {
                        const gain = bet.potentialGain || bet.amount * 2;
                        await updateDoc(betDoc.ref, { status: 'WON', gain, resolvedAt: Date.now() });
                        await updateDoc(profileRef, { coins: increment(gain) });
                      }
                    }
                }
            }

            // Refresh matches
            fetchMatches();
            return true;

        } catch (err) {
            console.error('[Admin] Error overriding match:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Credit user wallet (for commercial gestures)
    const creditUser = async (userId: string, amount: number, reason: string): Promise<boolean> => {
        if (!adminUser || adminUser.role !== 'SUPER_ADMIN') {
            setError('Action réservée aux Super Admins');
            return false;
        }

        // Plafond check
        const MAX_CREDIT = 10000;
        if (amount > MAX_CREDIT) {
            setError(`Montant maximum autorisé: ${MAX_CREDIT} coins`);
            return false;
        }

        try {
            // In production: Use transactions to safely update balance
            // For now, just log the action
            await logAction('USER_CREDIT', userId, {
                amount,
                reason
            });

            return true;
        } catch (err) {
            console.error('[Admin] Error crediting user:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            return false;
        }
    };

    // Ban user
    const banUser = async (userId: string, banType: 'CHAT' | 'TOTAL', reason: string): Promise<boolean> => {
        if (!adminUser) return false;

        // Moderators can only ban from chat
        if (adminUser.role === 'MODERATOR' && banType === 'TOTAL') {
            setError('Les modérateurs ne peuvent que bannir du chat');
            return false;
        }

        try {
            const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'profile', 'data');

            await updateDoc(userRef, {
                isBanned: banType === 'TOTAL',
                isChatBanned: true,
                banReason: reason,
                bannedBy: adminUser.uid,
                bannedAt: serverTimestamp()
            });

            await logAction('USER_BAN', userId, {
                banType,
                reason
            });

            return true;
        } catch (err) {
            console.error('[Admin] Error banning user:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            return false;
        }
    };

    // Load initial data
    useEffect(() => {
        if (adminUser) {
            fetchMatches();
            fetchLogs();
        }
    }, [adminUser?.uid]);

    return {
        matches,
        logs,
        loading,
        error,
        overrideMatch,
        creditUser,
        banUser,
        logAction,
        refreshMatches: fetchMatches,
        refreshLogs: fetchLogs
    };
};

// Hook for API quota monitoring
export const useApiQuota = (): ApiQuotaData => {
    const [dailyStats, setDailyStats] = useState<ApiDailyStats[]>([]);
    const [currentQuota, setCurrentQuota] = useState({
        remaining: 0,
        limit: 100,
        used: 0,
        usagePercent: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to last 30 days of stats
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const startDate = last30Days.toISOString().split('T')[0];

        const statsQuery = query(
            collection(db, 'artifacts', APP_ID, 'admin', 'api_monitoring', 'daily_stats'),
            where('date', '>=', startDate),
            orderBy('date', 'desc'),
            limit(30)
        );

        const unsubscribe = onSnapshot(
            statsQuery,
            (snapshot) => {
                const stats: ApiDailyStats[] = [];
                snapshot.forEach((doc) => {
                    stats.push({
                        date: doc.id,
                        ...doc.data()
                    } as ApiDailyStats);
                });

                // Sort by date ascending for charts
                stats.sort((a, b) => a.date.localeCompare(b.date));
                setDailyStats(stats);

                // Get current quota from most recent entry
                if (stats.length > 0) {
                    const latest = stats[stats.length - 1];
                    const remaining = latest.last_remaining ?? 0;
                    const limit = latest.last_limit ?? 100;
                    const used = limit - remaining;
                    const usagePercent = limit > 0 ? (used / limit) * 100 : 0;

                    setCurrentQuota({
                        remaining,
                        limit,
                        used,
                        usagePercent,
                    });
                }

                setLoading(false);
            },
            (error) => {
                console.error('[useApiQuota] Error fetching stats:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return {
        dailyStats,
        currentQuota,
        loading,
    };
};

// Default feature flags configuration
const DEFAULT_FLAGS: FeatureFlagsConfig = {
    debug_mode: false,
    experimental_features: {
        ultimate_fantazia: false,
        blitz_mode: false,
        marketplace: false,
        social_stories: true,
        voice_chat: false,
    },
    sync_intervals: {
        match_polling_seconds: 60,
        leaderboard_refresh_seconds: 30,
        chat_refresh_seconds: 5,
        api_quota_check_minutes: 15,
    },
    api_settings: {
        enable_api_calls: true,
        max_daily_calls: 100,
        enable_caching: true,
        cache_ttl_minutes: 60,
    },
    maintenance: {
        enabled: false,
        message: '',
        allowed_users: [],
    },
    last_updated: Date.now(),
    updated_by: 'system',
};

// Hook for feature flags management
export const useFeatureFlags = (environment: Environment = 'dev') => {
    const [flags, setFlags] = useState<FeatureFlagsConfig>(DEFAULT_FLAGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const flagsDocRef = doc(db, 'artifacts', APP_ID, 'config', 'feature_flags', 'environments', environment);

        const unsubscribe = onSnapshot(
            flagsDocRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as EnvironmentConfig;
                    setFlags(data.flags);
                } else {
                    setFlags(DEFAULT_FLAGS);
                }
                setLoading(false);
            },
            (err) => {
                console.error('[useFeatureFlags] Error fetching flags:', err);
                setError(err.message);
                setFlags(DEFAULT_FLAGS);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [environment]);

    const updateFlags = async (
        newFlags: Partial<FeatureFlagsConfig>,
        userId: string,
        userName: string
    ): Promise<boolean> => {
        try {
            const flagsDocRef = doc(db, 'artifacts', APP_ID, 'config', 'feature_flags', 'environments', environment);
            
            const updatedFlags: FeatureFlagsConfig = {
                ...flags,
                ...newFlags,
                last_updated: Date.now(),
                updated_by: userName,
            };

            await setDoc(flagsDocRef, {
                environment,
                flags: updatedFlags,
            });

            const logRef = collection(db, 'artifacts', APP_ID, 'config', 'feature_flags', 'logs');
            await addDoc(logRef, {
                environment,
                changed_by: userId,
                changed_by_name: userName,
                changes: newFlags,
                timestamp: serverTimestamp(),
            });

            return true;
        } catch (err) {
            console.error('[useFeatureFlags] Error updating flags:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            return false;
        }
    };

    const resetToDefaults = async (userId: string, userName: string): Promise<boolean> => {
        try {
            const flagsDocRef = doc(db, 'artifacts', APP_ID, 'config', 'feature_flags', 'environments', environment);
            
            const resetFlags: FeatureFlagsConfig = {
                ...DEFAULT_FLAGS,
                last_updated: Date.now(),
                updated_by: userName,
            };

            await setDoc(flagsDocRef, {
                environment,
                flags: resetFlags,
            });

            const logRef = collection(db, 'artifacts', APP_ID, 'config', 'feature_flags', 'logs');
            await addDoc(logRef, {
                environment,
                changed_by: userId,
                changed_by_name: userName,
                changes: { action: 'RESET_TO_DEFAULTS' },
                timestamp: serverTimestamp(),
            });

            return true;
        } catch (err) {
            console.error('[useFeatureFlags] Error resetting flags:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            return false;
        }
    };

    return {
        flags,
        loading,
        error,
        updateFlags,
        resetToDefaults,
    };
};

// Hook to get change logs
export const useFeatureFlagsLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const logsQuery = query(
            collection(db, 'artifacts', APP_ID, 'config', 'feature_flags', 'logs'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(
            logsQuery,
            (snapshot) => {
                const logData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setLogs(logData);
                setLoading(false);
            },
            (error) => {
                console.error('[useFeatureFlagsLogs] Error fetching logs:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { logs, loading };
};

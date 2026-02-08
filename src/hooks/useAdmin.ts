import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, addDoc, where, orderBy, limit, serverTimestamp, increment } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

interface AdminLog {
    id?: string;
    adminId: string;
    adminName: string;
    action: 'MATCH_OVERRIDE' | 'USER_CREDIT' | 'USER_BAN' | 'PUSH_SENT';
    targetId: string;
    diff: Record<string, any>;
    timestamp: any;
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
        } catch (err: any) {
            console.error('[Admin] Error fetching matches:', err);
            setError(err.message);
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
        } catch (err: any) {
            console.error('[Admin] Error fetching logs:', err);
        }
    };

    // Log admin action
    const logAction = async (action: AdminLog['action'], targetId: string, diff: Record<string, any>) => {
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
        } catch (err: any) {
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

        } catch (err: any) {
            console.error('[Admin] Error overriding match:', err);
            setError(err.message);
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
        } catch (err: any) {
            console.error('[Admin] Error crediting user:', err);
            setError(err.message);
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
        } catch (err: any) {
            console.error('[Admin] Error banning user:', err);
            setError(err.message);
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

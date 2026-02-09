import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, APP_ID } from '../../../config/firebase';
import type { Match, DataStaleness } from '../../../types/types';

const calculateStaleness = (matches: Match[]): DataStaleness => {
    if (matches.length === 0) {
        return {
            isFresh: true,
            severity: 'ok',
        };
    }

    // Find most recent update timestamp
    const mostRecentUpdate = matches.reduce((latest, match) => {
        const updateTime = match.updated_at?.toMillis?.() || 0;
        return Math.max(latest, updateTime);
    }, 0);

    if (!mostRecentUpdate) {
        return {
            isFresh: false,
            severity: 'critical',
            message: 'Aucune donnée disponible',
        };
    }

    const now = Date.now();
    const minutesSinceUpdate = (now - mostRecentUpdate) / 60000;

    // Check if there are live matches
    const hasLiveMatches = matches.some(m => 
        ['LIVE', 'LIVE_1ST_HALF', 'LIVE_2ND_HALF', 'HALF_TIME'].includes(m.status || '')
    );

    if (hasLiveMatches) {
        // Live matches should update every 1-2 minutes
        if (minutesSinceUpdate < 3) {
            return { isFresh: true, severity: 'ok', lastUpdate: mostRecentUpdate };
        } else if (minutesSinceUpdate < 5) {
            return {
                isFresh: false,
                severity: 'warning',
                lastUpdate: mostRecentUpdate,
                minutesSinceUpdate,
                message: 'Données en direct légèrement retardées',
            };
        } else if (minutesSinceUpdate < 15) {
            return {
                isFresh: false,
                severity: 'stale',
                lastUpdate: mostRecentUpdate,
                minutesSinceUpdate,
                message: 'Données en direct retardées',
            };
        } else {
            return {
                isFresh: false,
                severity: 'critical',
                lastUpdate: mostRecentUpdate,
                minutesSinceUpdate,
                message: 'Connexion API perdue - Affichage des dernières données',
            };
        }
    } else {
        // Pre-match or finished matches can be older
        if (minutesSinceUpdate < 60) {
            return { isFresh: true, severity: 'ok', lastUpdate: mostRecentUpdate };
        } else if (minutesSinceUpdate < 180) {
            return {
                isFresh: false,
                severity: 'warning',
                lastUpdate: mostRecentUpdate,
                minutesSinceUpdate,
                message: 'Données partiellement à jour',
            };
        } else {
            return {
                isFresh: false,
                severity: 'stale',
                lastUpdate: mostRecentUpdate,
                minutesSinceUpdate,
                message: 'Données potentiellement obsolètes',
            };
        }
    }
};

export const useMatchFeed = (dateStr: string) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query matches for the given date (formatted as ISO string or date string)
        // Note: Our syncFixtures saves kickoff_at as a Timestamp

        // Let's assume dateStr is YYYY-MM-DD
        const startOfDay = new Date(`${dateStr}T00:00:00Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59Z`);

        const matchesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'matches');
        const q = query(
            matchesRef,
            where('kickoff_at', '>=', startOfDay),
            where('kickoff_at', '<=', endOfDay),
            orderBy('kickoff_at', 'asc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const matchList: Match[] = [];
            snapshot.forEach((docSnap) => {
                matchList.push({ id: docSnap.id, ...docSnap.data() } as Match);
            });
            setMatches(matchList);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching matches:', error);
            setLoading(false);
        });

        return () => unsub();
    }, [dateStr]);

    const staleness = useMemo(() => calculateStaleness(matches), [matches]);

    return { matches, loading, staleness };
};

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { Match } from '../types/types';

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

    return { matches, loading };
};

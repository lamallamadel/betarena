import { useState, useEffect } from 'react';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { Match, MatchEventType } from '../types/types';

export interface MatchEvent {
    id: string;
    type: MatchEventType;
    minute: number;
    team: 'home' | 'away' | 'system';
    player_main?: string;
    player_assist?: string;
    is_cancelled?: boolean;
    text?: string;
    timestamp?: number;
}

export const useMatchLive = (matchId: string, initialMatch?: Match) => {
    const [liveMatch, setLiveMatch] = useState<Match | undefined>(initialMatch);
    const [events, setEvents] = useState<MatchEvent[]>([]);

    useEffect(() => {
        if (!matchId) return;

        // 1. Listen to Match Document (Score, Status, Minute)
        // Note: Assuming matches are stored at root 'matches' or under 'artifacts/.../matches'
        // For this project structure, let's assume they are under the standard artifact path
        const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', matchId);

        const unsubMatch = onSnapshot(matchRef, (doc) => {
            if (doc.exists()) {
                setLiveMatch({ id: doc.id, ...doc.data() } as Match);
            }
        });

        // 2. Listen to Match Events
        // Assuming 'match_events' is a collection in the artifact path
        const eventsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'match_events');
        const q = query(
            eventsRef,
            where('match_id', '==', matchId)
            // orderBy can be tricky with where on different field, let's sort client side if needed or use index
        );

        const unsubEvents = onSnapshot(q, (snapshot) => {
            const newEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MatchEvent));

            // Sort client-side by minute (descending) + timestamp if minute equal
            newEvents.sort((a, b) => {
                if (b.minute !== a.minute) return b.minute - a.minute;
                return (b.timestamp || 0) - (a.timestamp || 0);
            });

            setEvents(newEvents);
        });

        return () => {
            unsubMatch();
            unsubEvents();
        };
    }, [matchId]);

    return { liveMatch, events };
};

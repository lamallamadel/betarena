import { db, APP_ID } from '../config/firebase';
import { doc, collection, addDoc, setDoc, increment } from 'firebase/firestore';
import type { MatchEventType } from '../types/types';

// Helper to write to Firestore (Dev/Admin only)
export const MatchSimulator = {
    async triggerGoal(matchId: string, team: 'home' | 'away', player: string, minute: number) {
        const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', matchId);
        const eventsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'match_events');

        // 1. Add Event
        await addDoc(eventsRef, {
            match_id: matchId,
            type: 'GOAL',
            minute: minute || 0,
            team,
            player_main: player,
            text: `But - ${player}`,
            timestamp: Date.now(),
            is_cancelled: false
        });

        // 2. Update Score (Safe create if not exists)
        await setDoc(matchRef, {
            [`${team}Score`]: increment(1),
            minute, // Sync minute
            // Ensure ID is set if creating
            id: matchId,
            status: 'LIVE' // Force status if creating
        }, { merge: true });
    },

    async triggerEvent(matchId: string, type: MatchEventType, team: 'home' | 'away' | 'system', text: string, minute: number) {
        const eventsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'match_events');
        await addDoc(eventsRef, {
            match_id: matchId,
            type,
            minute: minute || 0,
            team,
            text,
            timestamp: Date.now()
        });
    },

    async triggerVarCancel(matchId: string, eventId: string, team: 'home' | 'away') {
        const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', matchId);
        const eventRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'match_events', eventId);

        // 1. Mark event as cancelled
        await setDoc(eventRef, {
            is_cancelled: true,
            type: 'VAR'
        }, { merge: true });

        // 2. Revert Score (if it was a goal)
        await setDoc(matchRef, {
            [`${team}Score`]: increment(-1)
        }, { merge: true });
    },

    async updateMinute(matchId: string, minute: number) {
        const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', matchId);
        await setDoc(matchRef, { minute }, { merge: true });
    },

    async resetMatch(matchId: string) {
        const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', matchId);
        await setDoc(matchRef, {
            homeScore: 0,
            awayScore: 0,
            minute: 0,
            status: 'LIVE'
        }, { merge: true });
    }
};

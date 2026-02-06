import { db, APP_ID } from '../config/firebase';
import { doc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';
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
            minute,
            team,
            player_main: player,
            text: `But - ${player}`,
            timestamp: Date.now(),
            is_cancelled: false
        });

        // 2. Update Score
        await updateDoc(matchRef, {
            [`${team}Score`]: increment(1),
            minute // Sync minute
        });
    },

    async triggerEvent(matchId: string, type: MatchEventType, team: 'home' | 'away' | 'system', text: string, minute: number) {
        const eventsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'match_events');
        await addDoc(eventsRef, {
            match_id: matchId,
            type,
            minute,
            team,
            text,
            timestamp: Date.now()
        });
    },

    async triggerVarCancel(matchId: string, eventId: string, team: 'home' | 'away') {
        const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', matchId);
        const eventRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'match_events', eventId);

        // 1. Mark event as cancelled
        await updateDoc(eventRef, {
            is_cancelled: true,
            type: 'VAR' // Optional: Change type or keep original and just flag it
        });

        // 2. Revert Score (if it was a goal)
        // Note: In real app, we should check if event was GOAL. Assuming YES for this button.
        await updateDoc(matchRef, {
            [`${team}Score`]: increment(-1)
        });
    },

    async updateMinute(matchId: string, minute: number) {
        const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', matchId);
        await updateDoc(matchRef, { minute });
    },

    async resetMatch(matchId: string) {
        const matchRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'matches', matchId);
        await updateDoc(matchRef, {
            homeScore: 0,
            awayScore: 0,
            minute: 0,
            status: 'LIVE'
        });
        // Note: Deleting events is harder without a cloud function, ignoring for now (events will pile up or we filter by timestamp/session)
    }
};

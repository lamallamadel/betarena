/**
 * Module N: Blitz 5 Resolution - Cloud Function
 * Scores all entries, ranks participants, distributes prize pool.
 */

import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = "botola-v1";

// Reuse scoring rules from Module M
const SCORING = {
    presence_60min: 2,
    goal: { GK: 6, DEF: 6, MID: 5, FWD: 4 } as Record<string, number>,
    assist: 3,
    clean_sheet: 4,
    yellow_card: -1,
    red_card: -3,
    goals_conceded_per_2: -1,
};

const getMockPlayerStats = (playerRefId: string) => {
    const hash = playerRefId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const seed = (hash * 9301 + 49297) % 233280;
    const rng = seed / 233280;
    return {
        minutes_played: rng > 0.1 ? Math.floor(60 + rng * 30) : 0,
        goals: rng > 0.65 ? Math.floor(rng * 2) : 0,
        assists: rng > 0.7 ? 1 : 0,
        yellow_cards: rng > 0.85 ? 1 : 0,
        red_cards: 0,
        clean_sheet: rng > 0.5,
        goals_conceded: rng > 0.5 ? 0 : Math.floor(rng * 2),
    };
};

const calculatePlayerPoints = (position: string, stats: ReturnType<typeof getMockPlayerStats>): number => {
    let points = 0;
    if (stats.minutes_played === 0) return 0;
    if (stats.minutes_played >= 60) points += SCORING.presence_60min;
    points += stats.goals * (SCORING.goal[position] || 4);
    points += stats.assists * SCORING.assist;
    if (stats.clean_sheet && (position === "GK" || position === "DEF") && stats.minutes_played >= 60) {
        points += SCORING.clean_sheet;
    }
    points += stats.yellow_cards * SCORING.yellow_card;
    if (position === "GK" || position === "DEF") {
        points += Math.floor(stats.goals_conceded / 2) * SCORING.goals_conceded_per_2;
    }
    return points;
};

/**
 * POST /resolveBlitz
 * Body: { tournamentId: string }
 */
export const resolveBlitz = onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    const { tournamentId } = req.body;
    if (!tournamentId) {
        res.status(400).json({ error: "tournamentId required" });
        return;
    }

    try {
        const tournRef = db.collection("artifacts").doc(APP_ID)
            .collection("public").doc("data")
            .collection("blitz_tournaments").doc(tournamentId);

        const tournDoc = await tournRef.get();
        if (!tournDoc.exists || tournDoc.data()?.status !== "LIVE") {
            res.status(400).json({ error: "Tournament not in LIVE status" });
            return;
        }

        const tournament = tournDoc.data()!;
        logger.info(`Resolving blitz ${tournamentId}`);

        // Collect all entries from all users
        const usersSnap = await db.collection("artifacts").doc(APP_ID)
            .collection("users").get();

        interface ScoredEntry {
            userId: string;
            entryRef: admin.firestore.DocumentReference;
            totalScore: number;
            createdAt: number;
        }

        const entries: ScoredEntry[] = [];

        for (const userDoc of usersSnap.docs) {
            const entryRef = db.collection("artifacts").doc(APP_ID)
                .collection("users").doc(userDoc.id)
                .collection("blitz_entries").doc(tournamentId);

            const entryDoc = await entryRef.get();
            if (!entryDoc.exists) continue;

            const entry = entryDoc.data()!;
            if (!entry.selected_lineup || entry.selected_lineup.length === 0) continue;

            // Score each of the 5 players
            let totalScore = 0;
            for (const card of entry.selected_lineup) {
                const stats = getMockPlayerStats(card.player_reference_id);
                totalScore += calculatePlayerPoints(card.player?.position || "MID", stats);
            }

            // Update entry score
            await entryRef.update({ total_score: totalScore });

            entries.push({
                userId: userDoc.id,
                entryRef,
                totalScore,
                createdAt: entry.created_at || 0,
            });
        }

        // Rank: total_score DESC, then created_at ASC (RG-N05)
        entries.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return a.createdAt - b.createdAt;
        });

        // Distribute prize pool: top 10% get prizes
        const prizePool = tournament.prize_pool || 0;
        const payoutCount = Math.max(1, Math.floor(entries.length * 0.1));

        const stats = { resolved: entries.length, winners: 0, totalDistributed: 0 };

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const rank = i + 1;
            let winAmount = 0;

            if (i < payoutCount && prizePool > 0) {
                // Distribution: 1st=50%, 2nd=25%, rest split 25%
                if (i === 0) {
                    winAmount = Math.floor(prizePool * 0.5);
                } else if (i === 1) {
                    winAmount = Math.floor(prizePool * 0.25);
                } else {
                    const remaining = Math.floor(prizePool * 0.25);
                    const restCount = payoutCount - 2;
                    winAmount = restCount > 0 ? Math.floor(remaining / restCount) : 0;
                }
            }

            // Update entry rank + winnings
            await entry.entryRef.update({ rank, win_amount: winAmount });

            // Credit winner's wallet
            if (winAmount > 0) {
                await db.runTransaction(async (t: admin.firestore.Transaction) => {
                    const profileRef = db.collection("artifacts").doc(APP_ID)
                        .collection("users").doc(entry.userId)
                        .collection("data").doc("profile");
                    const profileDoc = await t.get(profileRef);
                    const currentCoins = profileDoc.data()?.coins || 0;
                    t.update(profileRef, { coins: currentCoins + winAmount });
                });
                stats.winners++;
                stats.totalDistributed += winAmount;
            }

            // Write to public leaderboard
            await tournRef.collection("leaderboard").doc(entry.userId).set({
                user_id: entry.userId,
                total_score: entry.totalScore,
                rank,
                win_amount: winAmount,
                created_at: entry.createdAt,
            });
        }

        // Update tournament status
        await tournRef.update({ status: "COMPLETED" });

        logger.info(`Blitz ${tournamentId} resolved`, { stats });
        res.json({ success: true, stats });
    } catch (error) {
        logger.error("Error resolving blitz", { error });
        res.status(500).json({ error: "Internal server error" });
    }
});

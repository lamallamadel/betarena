/**
 * Module M: Fantasy Team Resolution - Cloud Function
 * Calculates player points, handles auto-substitution (RG-M03),
 * and distributes rewards after a gameweek.
 */

import { onRequest } from "firebase-functions/https";
import { onDocumentUpdated } from "firebase-functions/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = "botola-v1";

// RG-M01: Scoring rules
const SCORING = {
    presence_60min: 2,
    goal: { GK: 6, DEF: 6, MID: 5, FWD: 4 } as Record<string, number>,
    assist: 3,
    clean_sheet: 4,
    yellow_card: -1,
    red_card: -3,
    goals_conceded_per_2: -1,
};

// Mock player stats generator (deterministic based on player ID)
const getMockPlayerStats = (playerRefId: string) => {
    const hash = playerRefId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const seed = (hash * 9301 + 49297) % 233280;
    const rng = seed / 233280;

    return {
        minutes_played: rng > 0.15 ? Math.floor(60 + rng * 30) : 0, // 85% chance of playing
        goals: rng > 0.7 ? Math.floor(rng * 2) : 0,
        assists: rng > 0.75 ? 1 : 0,
        yellow_cards: rng > 0.8 ? 1 : 0,
        red_cards: rng > 0.95 ? 1 : 0,
        clean_sheet: rng > 0.5, // team-level, simplified
        goals_conceded: rng > 0.5 ? 0 : Math.floor(rng * 3),
    };
};

const calculatePlayerPoints = (
    position: string,
    stats: ReturnType<typeof getMockPlayerStats>
): number => {
    let points = 0;

    if (stats.minutes_played === 0) return 0;
    if (stats.minutes_played >= 60) points += SCORING.presence_60min;

    points += stats.goals * (SCORING.goal[position] || 4);
    points += stats.assists * SCORING.assist;

    if (stats.clean_sheet && (position === "GK" || position === "DEF") && stats.minutes_played >= 60) {
        points += SCORING.clean_sheet;
    }

    points += stats.yellow_cards * SCORING.yellow_card;
    points += stats.red_cards * SCORING.red_card;

    if (position === "GK" || position === "DEF") {
        points += Math.floor(stats.goals_conceded / 2) * SCORING.goals_conceded_per_2;
    }

    return points;
};

/**
 * POST /resolveGameweek
 * Body: { gameweekId: string }
 */
export const resolveGameweek = onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    const { gameweekId } = req.body;
    if (!gameweekId) {
        res.status(400).json({ error: "gameweekId required" });
        return;
    }

    try {
        const gwRef = db.collection("artifacts").doc(APP_ID)
            .collection("public").doc("data")
            .collection("gameweeks").doc(gameweekId);

        const gwDoc = await gwRef.get();
        if (!gwDoc.exists || gwDoc.data()?.status !== "LIVE") {
            res.status(400).json({ error: "Gameweek not in LIVE status" });
            return;
        }

        logger.info(`Resolving gameweek ${gameweekId}`);
        const stats = { processed: 0, totalCoinsDistributed: 0 };

        // Iterate all users
        const usersSnap = await db.collection("artifacts").doc(APP_ID)
            .collection("users").get();

        for (const userDoc of usersSnap.docs) {
            const userId = userDoc.id;
            const lineupRef = db.collection("artifacts").doc(APP_ID)
                .collection("users").doc(userId)
                .collection("lineups").doc(gameweekId);

            const lineupDoc = await lineupRef.get();
            if (!lineupDoc.exists) continue;

            const lineup = lineupDoc.data()!;
            if (lineup.status !== "LOCKED") continue;

            // Fetch lineup players
            const playersSnap = await lineupRef.collection("players").get();
            const players = playersSnap.docs.map((d: admin.firestore.QueryDocumentSnapshot) => ({ slot: d.id, ...d.data() }));

            const starters = players.filter((p: any) => p.position_slot <= 11);
            const bench = players.filter((p: any) => p.position_slot > 11)
                .sort((a: any, b: any) => a.position_slot - b.position_slot);

            // Calculate points for each starter
            const playerPoints: Record<string, number> = {};
            const playerStats: Record<string, ReturnType<typeof getMockPlayerStats>> = {};

            for (const p of starters) {
                const pData = p as any;
                const refId = pData.card?.player_reference_id || pData.card_id;
                const pStats = getMockPlayerStats(refId);
                playerStats[pData.card_id] = pStats;
                playerPoints[pData.card_id] = calculatePlayerPoints(
                    pData.card?.player?.position || "MID", pStats
                );
            }

            // RG-M03: Auto-substitution (position-compatible first, then any)
            const usedBench = new Set<string>();
            for (const starter of starters) {
                const sData = starter as any;
                const sStats = playerStats[sData.card_id];
                if (sStats && sStats.minutes_played === 0) {
                    const starterPos = sData.card?.player?.position || "MID";

                    // Priority 1: Same position bench player
                    let replaced = false;
                    for (const benchPlayer of bench) {
                        const bData = benchPlayer as any;
                        if (usedBench.has(bData.card_id)) continue;
                        const benchPos = bData.card?.player?.position || "MID";
                        if (benchPos !== starterPos) continue;

                        const bStats = getMockPlayerStats(bData.card?.player_reference_id || bData.card_id);
                        if (bStats.minutes_played > 0) {
                            const bPoints = calculatePlayerPoints(benchPos, bStats);
                            playerPoints[bData.card_id] = bPoints;
                            playerPoints[sData.card_id] = 0;
                            usedBench.add(bData.card_id);
                            await lineupRef.collection("players").doc(bData.slot).update({
                                is_subbed_in: true, points: bPoints,
                            });
                            replaced = true;
                            break;
                        }
                    }

                    // Priority 2: Any position bench player
                    if (!replaced) {
                        for (const benchPlayer of bench) {
                            const bData = benchPlayer as any;
                            if (usedBench.has(bData.card_id)) continue;
                            const bStats = getMockPlayerStats(bData.card?.player_reference_id || bData.card_id);
                            if (bStats.minutes_played > 0) {
                                const benchPos = bData.card?.player?.position || "MID";
                                const bPoints = calculatePlayerPoints(benchPos, bStats);
                                playerPoints[bData.card_id] = bPoints;
                                playerPoints[sData.card_id] = 0;
                                usedBench.add(bData.card_id);
                                await lineupRef.collection("players").doc(bData.slot).update({
                                    is_subbed_in: true, points: bPoints,
                                });
                                break;
                            }
                        }
                    }
                }
            }

            // Captain x2
            if (lineup.captain_id && playerPoints[lineup.captain_id]) {
                playerPoints[lineup.captain_id] *= 2;
            }

            // Sum total
            const totalScore = Object.values(playerPoints).reduce((s, p) => s + p, 0);

            // Update player points in DB
            for (const p of players) {
                const pData = p as any;
                if (playerPoints[pData.card_id] !== undefined) {
                    await lineupRef.collection("players").doc(pData.slot).update({
                        points: playerPoints[pData.card_id],
                    });
                }
            }

            // Update lineup total + credit user
            const coinsReward = totalScore * 10;
            const xpReward = totalScore * 5;

            await db.runTransaction(async (t: admin.firestore.Transaction) => {
                const profileRef = db.collection("artifacts").doc(APP_ID)
                    .collection("users").doc(userId)
                    .collection("data").doc("profile");
                const profileDoc = await t.get(profileRef);
                const currentCoins = profileDoc.data()?.coins || 0;
                const currentXp = profileDoc.data()?.xp || 0;

                t.update(lineupRef, { score_total: totalScore, status: "FINISHED" });
                t.update(profileRef, {
                    coins: currentCoins + coinsReward,
                    xp: currentXp + xpReward,
                });
            });

            stats.processed++;
            stats.totalCoinsDistributed += coinsReward;
        }

        // Update gameweek status
        await gwRef.update({ status: "FINISHED" });

        logger.info(`Gameweek ${gameweekId} resolved`, { stats });
        res.json({ success: true, stats });
    } catch (error) {
        logger.error("Error resolving gameweek", { error });
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Firestore trigger: Lock lineups when gameweek goes LIVE
 */
export const onGameweekLive = onDocumentUpdated(
    `artifacts/${APP_ID}/public/data/gameweeks/{gameweekId}`,
    async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();

        if (!after || before?.status === after.status) return;
        if (after.status !== "LIVE") return;

        const gameweekId = event.params.gameweekId;
        logger.info(`Locking lineups for gameweek ${gameweekId}`);

        const usersSnap = await db.collection("artifacts").doc(APP_ID)
            .collection("users").get();

        for (const userDoc of usersSnap.docs) {
            const lineupRef = db.collection("artifacts").doc(APP_ID)
                .collection("users").doc(userDoc.id)
                .collection("lineups").doc(gameweekId);

            const lineupDoc = await lineupRef.get();
            if (lineupDoc.exists && lineupDoc.data()?.status === "SAVED") {
                await lineupRef.update({ status: "LOCKED" });
            }
        }
    }
);

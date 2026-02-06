/**
 * Moteur de Résolution des Gains - Cloud Function
 * SFD Page 2: https://github.com/lamallamadel/betarena/wiki/SFD-:-Moteur-de-R%C3%A9solution-des-Gains-&-Leaderboards
 */

import { onRequest } from "firebase-functions/https";
import { onDocumentUpdated } from "firebase-functions/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = "betarena"; // TODO: Move to config

// Types
type PredictionType = "1N2" | "EXACT_SCORE" | "PENALTY_MISS";
type PredictionStatus = "PENDING" | "WON" | "LOST" | "VOID";
type PenaltyResult = "Goal" | "Saved" | "Missed" | "Woodwork";

interface Prediction {
    id: string;
    userId: string;
    matchId: string;
    type: PredictionType;
    selection: string;
    amount: number;
    odd: number | null;
    status: PredictionStatus;
}

interface MatchResult {
    matchId: string;
    status: "FINISHED";
    score: { h: number; a: number };
    hadPenaltyShootout: boolean;
    penaltyScore: { h: number; a: number } | null;
    penaltyEvents?: Array<{
        player: string;
        result: PenaltyResult;
        team: "home" | "away";
    }>;
}

interface CompetitionRules {
    calculation_mode: "ODDS_MULTIPLIER" | "FIXED";
    points_correct_1n2: number;
    points_correct_score: number;
}

// Default rules if competition rules not found
const DEFAULT_RULES: CompetitionRules = {
    calculation_mode: "FIXED",
    points_correct_1n2: 200,
    points_correct_score: 1000,
};

// ============================================
// CORE RESOLUTION LOGIC
// ============================================

/**
 * RG-B01: Détermine le vainqueur final du match
 */
const determineWinner = (
    score: { h: number; a: number },
    hadPenaltyShootout: boolean = false,
    penaltyScore: { h: number; a: number } | null = null
): "1" | "N" | "2" => {
    if (hadPenaltyShootout && penaltyScore) {
        return penaltyScore.h > penaltyScore.a ? "1" : "2";
    }
    if (score.h > score.a) return "1";
    if (score.a > score.h) return "2";
    return "N";
};

/**
 * RG-B02: Calcule le gain selon le mode
 */
const calculateGain = (
    prediction: { type: PredictionType; amount: number; odd: number | null },
    rules: CompetitionRules
): number => {
    if (rules.calculation_mode === "FIXED") {
        if (prediction.type === "1N2") return rules.points_correct_1n2;
        if (prediction.type === "EXACT_SCORE") return rules.points_correct_score;
        return 500; // PENALTY_MISS default
    } else {
        if (prediction.odd) {
            return Math.floor(prediction.amount * prediction.odd);
        }
        return prediction.amount * 2; // Fallback
    }
};

/**
 * RG-B01: Résout un pari Penalty Miss
 * Saved/Missed/Woodwork = GAGNANT (car pas de but)
 */
const resolvePenaltyBet = (
    prediction: Prediction,
    penaltyEvents: MatchResult["penaltyEvents"],
    rules: CompetitionRules
): { status: PredictionStatus; gain: number; reason?: string } => {
    if (!penaltyEvents || penaltyEvents.length === 0) {
        // Pas d'événements penalty - VOID + remboursement
        return {
            status: "VOID",
            gain: prediction.amount,
            reason: "Aucun penalty tiré durant le match",
        };
    }

    // selection format: "PlayerName" (le joueur qui doit rater)
    const playerName = prediction.selection;
    const playerPenalty = penaltyEvents.find(
        (e) => e.player.toLowerCase() === playerName.toLowerCase()
    );

    if (!playerPenalty) {
        // Le joueur n'a pas tiré - VOID + remboursement
        return {
            status: "VOID",
            gain: prediction.amount,
            reason: `${playerName} n'a pas tiré de penalty`,
        };
    }

    // Si le résultat n'est PAS un but -> GAGNANT
    if (
        playerPenalty.result === "Saved" ||
        playerPenalty.result === "Missed" ||
        playerPenalty.result === "Woodwork"
    ) {
        return {
            status: "WON",
            gain: calculateGain(prediction, rules),
        };
    }

    // Le joueur a marqué -> PERDANT
    return { status: "LOST", gain: 0 };
};

/**
 * Résout un pari individuel
 */
const resolveBet = (
    prediction: Prediction,
    match: MatchResult,
    rules: CompetitionRules
): { status: PredictionStatus; gain: number; reason?: string } => {
    const winner = determineWinner(
        match.score,
        match.hadPenaltyShootout,
        match.penaltyScore
    );
    const finalScore = `${match.score.h}-${match.score.a}`;

    // Type 1N2
    if (prediction.type === "1N2") {
        if (match.hadPenaltyShootout && prediction.selection === "N") {
            return {
                status: "VOID",
                gain: prediction.amount,
                reason: "Match avec prolongations/TAB",
            };
        }
        if (prediction.selection === winner) {
            return { status: "WON", gain: calculateGain(prediction, rules) };
        }
        return { status: "LOST", gain: 0 };
    }

    // Type EXACT_SCORE
    if (prediction.type === "EXACT_SCORE") {
        if (prediction.selection === finalScore) {
            return { status: "WON", gain: calculateGain(prediction, rules) };
        }
        return { status: "LOST", gain: 0 };
    }

    // Type PENALTY_MISS
    if (prediction.type === "PENALTY_MISS") {
        return resolvePenaltyBet(prediction, match.penaltyEvents, rules);
    }

    return { status: "LOST", gain: 0 };
};

// ============================================
// BATCH RESOLUTION FUNCTION
// ============================================

/**
 * Résout tous les paris d'un match et met à jour le leaderboard
 */
const resolveMatchBets = async (matchResult: MatchResult): Promise<{
    resolved: number;
    won: number;
    lost: number;
    voided: number;
}> => {
    const stats = { resolved: 0, won: 0, lost: 0, voided: 0 };

    // 1. Récupérer tous les paris PENDING pour ce match
    const usersSnapshot = await db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .get();

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const predictionsRef = db
            .collection("artifacts")
            .doc(APP_ID)
            .collection("users")
            .doc(userId)
            .collection("predictions");

        const pendingBets = await predictionsRef
            .where("matchId", "==", matchResult.matchId)
            .where("status", "==", "PENDING")
            .get();

        for (const betDoc of pendingBets.docs) {
            const prediction = { id: betDoc.id, userId, ...betDoc.data() } as Prediction;

            // 2. Résoudre le pari
            const result = resolveBet(prediction, matchResult, DEFAULT_RULES);

            // 3. Transaction atomique: update pari + créditer wallet
            await db.runTransaction(async (t: admin.firestore.Transaction) => {
                const userProfileRef = db
                    .collection("artifacts")
                    .doc(APP_ID)
                    .collection("users")
                    .doc(userId)
                    .collection("data")
                    .doc("profile");

                const profileDoc = await t.get(userProfileRef);
                const currentCoins = profileDoc.data()?.coins || 0;

                // Update prediction status
                t.update(betDoc.ref, {
                    status: result.status,
                    resolvedAt: Date.now(),
                    gain: result.gain,
                    reason: result.reason || null,
                });

                // Créditer le wallet si WON ou VOID
                if (result.status === "WON" || result.status === "VOID") {
                    t.update(userProfileRef, { coins: currentCoins + result.gain });
                }

                // Update exact_score_count si applicable
                if (result.status === "WON" && prediction.type === "EXACT_SCORE") {
                    const currentCount = profileDoc.data()?.exact_score_count || 0;
                    t.update(userProfileRef, { exact_score_count: currentCount + 1 });
                }
            });

            // 4. Update leaderboard (Firestore placeholder for Redis ZSET)
            await updateLeaderboard(userId);

            stats.resolved++;
            if (result.status === "WON") stats.won++;
            else if (result.status === "LOST") stats.lost++;
            else stats.voided++;
        }
    }

    return stats;
};

/**
 * Met à jour le leaderboard Firestore (placeholder for Redis ZSET)
 */
const updateLeaderboard = async (userId: string): Promise<void> => {
    const profileRef = db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .doc(userId)
        .collection("data")
        .doc("profile");

    const profileDoc = await profileRef.get();
    const profile = profileDoc.data();

    if (!profile) return;

    const leaderboardRef = db.collection("leaderboard").doc(userId);
    await leaderboardRef.set(
        {
            userId,
            totalCoins: profile.coins || 0,
            exactScoreCount: profile.exact_score_count || 0,
            updatedAt: Date.now(),
        },
        { merge: true }
    );
};

// ============================================
// CLOUD FUNCTION EXPORTS
// ============================================

/**
 * Webhook endpoint for match finished
 * POST /resolveMatch
 */
export const resolveMatch = onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    try {
        const matchResult: MatchResult = req.body;

        if (!matchResult.matchId || matchResult.status !== "FINISHED") {
            res.status(400).json({ error: "Invalid match result payload" });
            return;
        }

        logger.info(`Resolving match ${matchResult.matchId}`, { matchResult });

        const stats = await resolveMatchBets(matchResult);

        logger.info(`Match ${matchResult.matchId} resolved`, { stats });
        res.json({ success: true, stats });
    } catch (error) {
        logger.error("Error resolving match", { error });
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Firestore trigger: Auto-resolve when match status changes to FINISHED
 */
export const onMatchFinished = onDocumentUpdated(
    "matches/{matchId}",
    async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();

        if (!after || before?.status === after.status) return;

        if (after.status === "FINISHED") {
            const matchResult: MatchResult = {
                matchId: event.params.matchId,
                status: "FINISHED",
                score: after.score || { h: 0, a: 0 },
                hadPenaltyShootout: after.hadPenaltyShootout || false,
                penaltyScore: after.penaltyScore || null,
                penaltyEvents: after.penaltyEvents || [],
            };

            logger.info(`Auto-resolving match ${event.params.matchId}`);
            await resolveMatchBets(matchResult);
        }
    }
);

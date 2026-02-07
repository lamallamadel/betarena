import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = "botola-v1";

const SHARE_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes (RG-02)
const MAX_DAILY_SHARES = 3; // RG-F02: Max 3 rewarded shares per day
const SHARE_REWARD = 10;

/**
 * Rec 2: Social Share Reward Backend
 * Validates cooldown and daily quota before granting reward.
 */
export const rewardShare = onCall(async (request) => {
    // 1. Ensure user is authenticated
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const userId = request.auth.uid;
    const now = Date.now();
    const userRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("data").doc("profile");

    try {
        const result = await db.runTransaction(async (t) => {
            const docSnap = await t.get(userRef);
            if (!docSnap.exists()) {
                throw new HttpsError("not-found", "User profile not found.");
            }

            const data = docSnap.data()!;
            const lastShare = data.lastShareTimestamp || 0;
            const today = new Date().toISOString().split('T')[0];
            const lastShareDate = data.lastShareDate || '';
            let dailyShareCount = data.dailyShareCount || 0;

            // Reset daily count if it's a new day
            if (lastShareDate !== today) {
                dailyShareCount = 0;
            }

            // Check Cooldown
            if (now - lastShare < SHARE_COOLDOWN_MS) {
                const waitSec = Math.ceil((SHARE_COOLDOWN_MS - (now - lastShare)) / 1000);
                return { success: false, reason: "cooldown", waitSeconds: waitSec };
            }

            // Check Daily Quota (RG-F02)
            if (dailyShareCount >= MAX_DAILY_SHARES) {
                return { success: false, reason: "quota_reached" };
            }

            // Grant Reward
            t.update(userRef, {
                coins: admin.firestore.FieldValue.increment(SHARE_REWARD),
                lastShareTimestamp: now,
                lastShareDate: today,
                dailyShareCount: dailyShareCount + 1,
                shareCount: admin.firestore.FieldValue.increment(1)
            });

            return { success: true, reward: SHARE_REWARD };
        });

        return result;

    } catch (error) {
        logger.error("Error in rewardShare", { userId, error });
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error.");
    }
});

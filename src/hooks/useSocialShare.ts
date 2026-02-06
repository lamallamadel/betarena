import { useState, useEffect } from 'react';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

const SHARE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const SHARE_REWARD = 10;

export const useSocialShare = (userId: string | undefined, profile: any) => {
    const [canReward, setCanReward] = useState(false);
    const [cooldownLeft, setCooldownLeft] = useState(0);

    // Update Timer every second
    useEffect(() => {
        if (!profile) return;

        const interval = setInterval(() => {
            const lastShare = profile.lastShareTimestamp || 0; // Timestamp of last share
            const now = Date.now();
            const timeSince = now - lastShare;

            if (timeSince < SHARE_COOLDOWN_MS) {
                setCanReward(false);
                setCooldownLeft(Math.ceil((SHARE_COOLDOWN_MS - timeSince) / 1000));
            } else {
                setCanReward(true);
                setCooldownLeft(0);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [profile]);

    const recordShare = async () => {
        if (!userId) return { success: false, rewarded: false };

        const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');
        const now = Date.now();

        try {
            await runTransaction(db, async (t) => {
                const docSnap = await t.get(userRef);
                if (!docSnap.exists()) return;

                const data = docSnap.data();
                const lastShare = data.lastShareTimestamp || 0;

                // Check Cooldown
                if (now - lastShare < SHARE_COOLDOWN_MS) {
                    // Not eligible for reward yet
                    return;
                    // We could still log it but no coins
                }

                // Grant Reward
                t.update(userRef, {
                    coins: increment(SHARE_REWARD),
                    lastShareTimestamp: now,
                    shareCount: increment(1)
                });
            });
            return { success: true, rewarded: canReward };
        } catch (e) {
            console.error("Share record error", e);
            return { success: false, error: e };
        }
    };

    return {
        canReward,
        cooldownLeft,
        recordShare
    };
};

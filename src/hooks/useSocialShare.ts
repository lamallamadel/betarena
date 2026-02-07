import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";

const SHARE_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes (RG-02)
const MAX_DAILY_SHARES = 3; // RG-F02: Max 3 rewarded shares per day

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
            const today = new Date().toISOString().split('T')[0];
            const currentDailyCount = profile.lastShareDate === today ? (profile.dailyShareCount || 0) : 0;
            const isQuotaFull = currentDailyCount >= MAX_DAILY_SHARES;

            if (timeSince < SHARE_COOLDOWN_MS || isQuotaFull) {
                setCanReward(false);
                setCooldownLeft(timeSince < SHARE_COOLDOWN_MS ? Math.ceil((SHARE_COOLDOWN_MS - timeSince) / 1000) : 0);
            } else {
                setCanReward(true);
                setCooldownLeft(0);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [profile]);

    const recordShare = async () => {
        if (!userId) return { success: false, rewarded: false };

        const functions = getFunctions();
        const rewardShareFn = httpsCallable(functions, "rewardShare");

        try {
            const result = await rewardShareFn();
            const data = result.data as any;

            if (data.success) {
                return { success: true, rewarded: true, reward: data.reward };
            } else {
                return { success: true, rewarded: false, reason: data.reason };
            }
        } catch (e) {
            console.error("Share reward error", e);
            return { success: false, error: e };
        }
    };

    return {
        canReward,
        cooldownLeft,
        recordShare
    };
};

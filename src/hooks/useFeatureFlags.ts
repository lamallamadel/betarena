import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { Environment, FeatureFlagsConfig } from '../types/types';

const DEFAULT_FLAGS: FeatureFlagsConfig = {
    debug_mode: false,
    experimental_features: {
        ultimate_fantazia: false,
        blitz_mode: false,
        marketplace: false,
        social_stories: true,
        voice_chat: false,
    },
    sync_intervals: {
        match_polling_seconds: 60,
        leaderboard_refresh_seconds: 30,
        chat_refresh_seconds: 5,
        api_quota_check_minutes: 15,
    },
    api_settings: {
        enable_api_calls: true,
        max_daily_calls: 100,
        enable_caching: true,
        cache_ttl_minutes: 60,
    },
    maintenance: {
        enabled: false,
        message: '',
        allowed_users: [],
    },
    last_updated: Date.now(),
    updated_by: 'system',
};

const getEnvironment = (): Environment => {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'dev';
    }
    
    if (hostname.includes('staging') || hostname.includes('preview')) {
        return 'staging';
    }
    
    return 'prod';
};

export const useFeatureFlags = () => {
    const [flags, setFlags] = useState<FeatureFlagsConfig>(DEFAULT_FLAGS);
    const [loading, setLoading] = useState(true);
    const [environment] = useState<Environment>(getEnvironment());

    useEffect(() => {
        const flagsDocRef = doc(
            db,
            'artifacts',
            APP_ID,
            'config',
            'feature_flags',
            'environments',
            environment
        );

        const unsubscribe = onSnapshot(
            flagsDocRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setFlags(data.flags || DEFAULT_FLAGS);
                } else {
                    setFlags(DEFAULT_FLAGS);
                }
                setLoading(false);
            },
            (error) => {
                console.error('[useFeatureFlags] Error fetching flags:', error);
                setFlags(DEFAULT_FLAGS);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [environment]);

    const isFeatureEnabled = (feature: keyof FeatureFlagsConfig['experimental_features']): boolean => {
        return flags.experimental_features[feature] ?? false;
    };

    const isDebugMode = (): boolean => {
        return flags.debug_mode ?? false;
    };

    const getPollingInterval = (type: keyof FeatureFlagsConfig['sync_intervals']): number => {
        return flags.sync_intervals[type] ?? DEFAULT_FLAGS.sync_intervals[type];
    };

    const isMaintenanceMode = (): boolean => {
        return flags.maintenance.enabled ?? false;
    };

    const getMaintenanceMessage = (): string => {
        return flags.maintenance.message || 'Application en maintenance. Veuillez réessayer plus tard.';
    };

    const canAccessDuringMaintenance = (userId: string): boolean => {
        if (!flags.maintenance.enabled) return true;
        return flags.maintenance.allowed_users.includes(userId);
    };

    const apiCallsEnabled = (): boolean => {
        return flags.api_settings.enable_api_calls ?? true;
    };

    const cachingEnabled = (): boolean => {
        return flags.api_settings.enable_caching ?? true;
    };

    const getCacheTTL = (): number => {
        return (flags.api_settings.cache_ttl_minutes ?? 60) * 60 * 1000; // Convert to ms
    };

    const getMaxDailyCalls = (): number => {
        return flags.api_settings.max_daily_calls ?? 100;
    };

    return {
        flags,
        loading,
        environment,
        isFeatureEnabled,
        isDebugMode,
        getPollingInterval,
        isMaintenanceMode,
        getMaintenanceMessage,
        canAccessDuringMaintenance,
        apiCallsEnabled,
        cachingEnabled,
        getCacheTTL,
        getMaxDailyCalls,
    };
};

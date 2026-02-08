/**
 * Feature Flags Context (Optional Provider)
 * 
 * This context provider is optional since the application uses the direct
 * useFeatureFlags() hook from hooks/useFeatureFlags.ts.
 * 
 * You can wrap your app with this provider if you prefer context-based access,
 * but it's not required for the current implementation.
 */

import React, { createContext, useContext } from 'react';
import { useFeatureFlags as useFeatureFlagsHook } from '../hooks/useFeatureFlags';

interface FeatureFlagsContextType {
    flags: ReturnType<typeof useFeatureFlagsHook>['flags'];
    loading: ReturnType<typeof useFeatureFlagsHook>['loading'];
    environment: ReturnType<typeof useFeatureFlagsHook>['environment'];
    isFeatureEnabled: ReturnType<typeof useFeatureFlagsHook>['isFeatureEnabled'];
    isDebugMode: ReturnType<typeof useFeatureFlagsHook>['isDebugMode'];
    getPollingInterval: ReturnType<typeof useFeatureFlagsHook>['getPollingInterval'];
    isMaintenanceMode: ReturnType<typeof useFeatureFlagsHook>['isMaintenanceMode'];
    getMaintenanceMessage: ReturnType<typeof useFeatureFlagsHook>['getMaintenanceMessage'];
    canAccessDuringMaintenance: ReturnType<typeof useFeatureFlagsHook>['canAccessDuringMaintenance'];
    apiCallsEnabled: ReturnType<typeof useFeatureFlagsHook>['apiCallsEnabled'];
    cachingEnabled: ReturnType<typeof useFeatureFlagsHook>['cachingEnabled'];
    getCacheTTL: ReturnType<typeof useFeatureFlagsHook>['getCacheTTL'];
    getMaxDailyCalls: ReturnType<typeof useFeatureFlagsHook>['getMaxDailyCalls'];
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const featureFlags = useFeatureFlagsHook();

    return (
        <FeatureFlagsContext.Provider value={featureFlags}>
            {children}
        </FeatureFlagsContext.Provider>
    );
};

export const useFeatureFlagsContext = () => {
    const context = useContext(FeatureFlagsContext);
    if (!context) {
        throw new Error('useFeatureFlagsContext must be used within FeatureFlagsProvider');
    }
    return context;
};

// Utility functions for direct use (without context)
export const isFeatureEnabled = (
    flags: FeatureFlagsContextType['flags'],
    feature: keyof FeatureFlagsContextType['flags']['experimental_features']
): boolean => {
    return flags.experimental_features[feature];
};

export const isMaintenanceMode = (flags: FeatureFlagsContextType['flags'], userId?: string): boolean => {
    if (!flags.maintenance.enabled) return false;
    if (!userId) return true;
    return !flags.maintenance.allowed_users.includes(userId);
};

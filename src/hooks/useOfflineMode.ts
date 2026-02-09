import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { ApiHealthStatus } from '../types/types';

/**
 * Lightweight hook to monitor API health status.
 * Use this in components that need to show offline warnings
 * but don't need full sync queue management.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, lastError } = useOfflineMode();
 *   
 *   if (!isOnline) {
 *     return <div>Offline - showing cached data</div>;
 *   }
 *   
 *   return <div>Online - showing live data</div>;
 * }
 * ```
 */
export const useOfflineMode = () => {
    const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({
        isOnline: true,
        consecutiveFailures: 0,
    });

    useEffect(() => {
        const healthRef = doc(db, 'artifacts', APP_ID, 'admin', 'api_health', 'status', 'current');
        
        const unsub = onSnapshot(healthRef, (docSnap) => {
            if (docSnap.exists()) {
                setApiHealth(docSnap.data() as ApiHealthStatus);
            }
        }, (error) => {
            console.error('Error listening to API health:', error);
        });

        return () => unsub();
    }, []);

    return {
        isOnline: apiHealth.isOnline,
        consecutiveFailures: apiHealth.consecutiveFailures,
        lastError: apiHealth.lastError,
        lastSuccessfulCall: apiHealth.lastSuccessfulCall,
        estimatedRecoveryTime: apiHealth.estimatedRecoveryTime,
    };
};

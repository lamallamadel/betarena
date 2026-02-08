import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMatchPollingOptions {
    interval?: number; // Interval in milliseconds (default 60000 = 60s)
    enabled?: boolean;
}

interface MatchData {
    id: string;
    status: string;
    score: { home: number; away: number };
    minute?: number;
    [key: string]: any;
}

/**
 * Hook for auto-refreshing match data at regular intervals
 * Implements RG-H.C: Polling toutes les 60s
 */
export const useMatchPolling = (
    fetchFunction: () => Promise<MatchData[]>,
    options: UseMatchPollingOptions = {}
) => {
    const { interval = 60000, enabled = true } = options;

    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<number | null>(null);
    const isMountedRef = useRef(true);

    // Fetch data with diff comparison
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            const newData = await fetchFunction();

            if (isMountedRef.current) {
                // Compare with previous data to only update if changed
                setMatches(prevMatches => {
                    const hasChanges = JSON.stringify(newData) !== JSON.stringify(prevMatches);
                    if (hasChanges) {
                        console.log('[Polling] Data changed, updating...');
                        return newData;
                    }
                    console.log('[Polling] No changes detected');
                    return prevMatches;
                });
                setLastUpdate(new Date());
            }
        } catch (err: any) {
            if (isMountedRef.current) {
                setError(err.message);
                console.error('[Polling] Error fetching data:', err);
            }
        } finally {
            if (isMountedRef.current && !silent) {
                setLoading(false);
            }
        }
    }, [fetchFunction]);

    // Initial fetch
    useEffect(() => {
        isMountedRef.current = true;
        fetchData();

        return () => {
            isMountedRef.current = false;
        };
    }, [fetchData]);

    // Polling interval
    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Setup polling (silent mode - no loading state)
        intervalRef.current = window.setInterval(() => {
            console.log('[Polling] Auto-refresh triggered');
            fetchData(true);
        }, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, interval, fetchData]);

    // Manual refresh function
    const refresh = useCallback(() => {
        fetchData(false);
    }, [fetchData]);

    return {
        matches,
        loading,
        lastUpdate,
        error,
        refresh
    };
};

/**
 * Simple interval hook for countdown display
 */
export const usePollingCountdown = (intervalMs: number = 60000, enabled: boolean = true) => {
    const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(Math.floor(intervalMs / 1000));

    useEffect(() => {
        if (!enabled) return;

        const countdown = setInterval(() => {
            setSecondsUntilRefresh(prev => {
                if (prev <= 1) return Math.floor(intervalMs / 1000);
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, [intervalMs, enabled]);

    return secondsUntilRefresh;
};

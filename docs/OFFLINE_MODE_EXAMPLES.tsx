/**
 * OFFLINE MODE INTEGRATION EXAMPLES
 * 
 * This file contains practical examples of how to integrate
 * offline mode handling in different parts of the application.
 * 
 * Copy these patterns to your own components.
 * 
 * NOTE: This is a documentation file with example code snippets.
 * It is not imported or executed in the app.
 */

import React from 'react';
import { useOfflineMode } from '../src/hooks/useOfflineMode';
import { useSyncQueue } from '../src/hooks/useSyncQueue';
import { useMatchFeed } from '../src/features/match/hooks/useMatchFeed';
import { ApiStatusIndicator } from '../src/components/ui/ApiStatusIndicator';

// ========================================
// Example 1: Simple Offline Indicator
// ========================================

export function Example1_SimpleIndicator() {
    const { isOnline } = useOfflineMode();

    return (
        <div className="p-4 bg-slate-900 rounded-lg">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Match List</h2>
                <ApiStatusIndicator showText />
            </div>
            
            {!isOnline && (
                <div className="mt-2 text-sm text-yellow-500">
                    ⚠️ Affichage des données en cache
                </div>
            )}
        </div>
    );
}

// ========================================
// Example 2: With Staleness Warning
// ========================================

export function Example2_StalenessWarning() {
    const { matches, staleness } = useMatchFeed('2025-01-15');

    return (
        <div className="space-y-4">
            {staleness.severity !== 'ok' && (
                <div className={`p-3 rounded-lg ${
                    staleness.severity === 'warning' ? 'bg-yellow-900/50' :
                    staleness.severity === 'stale' ? 'bg-orange-900/50' :
                    'bg-red-900/50'
                }`}>
                    <p className="text-sm font-bold">{staleness.message}</p>
                    {staleness.minutesSinceUpdate && (
                        <p className="text-xs">
                            Dernière mise à jour: {Math.round(staleness.minutesSinceUpdate)} min
                        </p>
                    )}
                </div>
            )}

            {matches.map(match => (
                <div key={match.id}>{match.home} vs {match.away}</div>
            ))}
        </div>
    );
}

// ========================================
// Example 3: With Manual Sync
// ========================================

export function Example3_ManualSync() {
    const { queueJob, processQueue } = useSyncQueue();

    return (
        <button
            onClick={async () => {
                await queueJob('FIXTURES', { date: '2025-01-15' });
                await processQueue();
            }}
        >
            Actualiser
        </button>
    );
}

// ========================================
// Example 4: Admin Dashboard
// ========================================

export function Example4_AdminDashboard() {
    const { jobs, apiHealth, pendingCount, failedCount } = useSyncQueue();

    return (
        <div>
            <p>API Status: {apiHealth.isOnline ? 'Online' : 'Offline'}</p>
            <p>Pending: {pendingCount}</p>
            <p>Failed: {failedCount}</p>
            {jobs.map(job => (
                <div key={job.id}>{job.type} - {job.status}</div>
            ))}
        </div>
    );
}

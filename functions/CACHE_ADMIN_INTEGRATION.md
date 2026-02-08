# Admin Dashboard Cache Management Integration Guide

This guide shows how to add cache management features to the BetArena admin dashboard.

## Frontend Integration

### 1. Add Cache Management Hook

Create `src/hooks/useCache.ts`:

```typescript
import { useCallback, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface CacheStats {
    enabled: boolean;
    keyCount?: number;
    memoryUsed?: string;
    hitRate?: string;
}

interface CacheOperation {
    loading: boolean;
    error: string | null;
    execute: (params?: any) => Promise<any>;
}

export function useCache() {
    const functions = getFunctions();
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get cache statistics
    const getCacheInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fn = httpsCallable(functions, 'getCacheInfo');
            const result = await fn({});
            setStats((result.data as any).stats);
            return result.data;
        } catch (err: any) {
            const errMsg = err.message || 'Failed to get cache info';
            setError(errMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [functions]);

    // Generic cache operation executor
    const createOperation = (functionName: string): CacheOperation => {
        const [opLoading, setOpLoading] = useState(false);
        const [opError, setOpError] = useState<string | null>(null);

        const execute = async (params?: any) => {
            setOpLoading(true);
            setOpError(null);
            try {
                const fn = httpsCallable(functions, functionName);
                const result = await fn(params || {});
                return result.data;
            } catch (err: any) {
                const errMsg = err.message || `Failed to execute ${functionName}`;
                setOpError(errMsg);
                throw err;
            } finally {
                setOpLoading(false);
            }
        };

        return { loading: opLoading, error: opError, execute };
    };

    return {
        stats,
        loading,
        error,
        getCacheInfo,
        invalidateFixtures: createOperation('invalidateFixturesCache'),
        invalidateLive: createOperation('invalidateLiveCache'),
        invalidateStandings: createOperation('invalidateStandingsCache'),
        invalidateEvents: createOperation('invalidateEventsCache'),
        invalidateLineups: createOperation('invalidateLineupsCache'),
        invalidateOdds: createOperation('invalidateOddsCache'),
        clearCache: createOperation('clearCache'),
    };
}
```

### 2. Add Cache Management Component

Create `src/components/admin/CacheManager.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useCache } from '../../hooks/useCache';
import { RefreshCw, Trash2, Database, AlertTriangle } from 'lucide-react';

export function CacheManager() {
    const { stats, loading, error, getCacheInfo, clearCache } = useCache();
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        getCacheInfo();
        // Refresh stats every 30 seconds
        const interval = setInterval(getCacheInfo, 30000);
        return () => clearInterval(interval);
    }, [getCacheInfo]);

    const handleClearCache = async () => {
        if (!confirmClear) {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 5000);
            return;
        }

        try {
            await clearCache.execute();
            await getCacheInfo(); // Refresh stats
            setConfirmClear(false);
        } catch (err) {
            console.error('Failed to clear cache:', err);
        }
    };

    if (loading && !stats) {
        return (
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Cache Redis</h3>
                </div>
                <p className="text-slate-400 mt-2">Chargement...</p>
            </div>
        );
    }

    if (!stats?.enabled) {
        return (
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Cache Redis</h3>
                </div>
                <div className="mt-4 flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cache désactivé (Redis non configuré)</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-semibold text-slate-200">Cache Redis</h3>
                </div>
                <button
                    onClick={getCacheInfo}
                    disabled={loading}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800 rounded-lg p-4">
                    <div className="text-sm text-slate-400">Clés en cache</div>
                    <div className="text-2xl font-bold text-emerald-500 mt-1">
                        {stats.keyCount?.toLocaleString() || '0'}
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4">
                    <div className="text-sm text-slate-400">Mémoire utilisée</div>
                    <div className="text-2xl font-bold text-blue-500 mt-1">
                        {stats.memoryUsed || 'N/A'}
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4">
                    <div className="text-sm text-slate-400">Taux de succès</div>
                    <div className="text-2xl font-bold text-yellow-500 mt-1">
                        {stats.hitRate || 'N/A'}
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
                <button
                    onClick={handleClearCache}
                    disabled={clearCache.loading}
                    className={`
                        w-full py-2 px-4 rounded-lg font-medium
                        flex items-center justify-center gap-2
                        transition-colors
                        ${confirmClear
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }
                        ${clearCache.loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <Trash2 className="w-4 h-4" />
                    {clearCache.loading
                        ? 'Effacement...'
                        : confirmClear
                        ? 'Confirmer l\'effacement complet'
                        : 'Effacer tout le cache'
                    }
                </button>
                {confirmClear && (
                    <p className="text-xs text-yellow-500 text-center mt-2">
                        ⚠️ Cliquez à nouveau pour confirmer (expire dans 5s)
                    </p>
                )}
            </div>
        </div>
    );
}
```

### 3. Add Granular Cache Controls

Create `src/components/admin/CacheControls.tsx`:

```typescript
import { useState } from 'react';
import { useCache } from '../../hooks/useCache';
import { Trash2 } from 'lucide-react';

export function CacheControls() {
    const cache = useCache();
    const [fixtureDate, setFixtureDate] = useState('');
    const [leagueId, setLeagueId] = useState('');
    const [fixtureId, setFixtureId] = useState('');

    const handleInvalidateFixtures = async () => {
        const params: any = {};
        if (fixtureDate) params.date = fixtureDate;
        if (leagueId) params.leagueId = parseInt(leagueId);
        
        await cache.invalidateFixtures.execute(params);
        await cache.getCacheInfo(); // Refresh stats
    };

    const handleInvalidateEvents = async () => {
        const params = fixtureId ? { fixtureId: parseInt(fixtureId) } : {};
        await cache.invalidateEvents.execute(params);
        await cache.getCacheInfo();
    };

    return (
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">
                Invalidation sélective du cache
            </h3>

            {/* Fixtures */}
            <div className="mb-4 pb-4 border-b border-slate-800">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Matchs programmés</h4>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={fixtureDate}
                        onChange={(e) => setFixtureDate(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200"
                        placeholder="Date"
                    />
                    <input
                        type="number"
                        value={leagueId}
                        onChange={(e) => setLeagueId(e.target.value)}
                        className="w-32 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200"
                        placeholder="League ID"
                    />
                    <button
                        onClick={handleInvalidateFixtures}
                        disabled={cache.invalidateFixtures.loading}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Events */}
            <div className="mb-4 pb-4 border-b border-slate-800">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Événements de match</h4>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={fixtureId}
                        onChange={(e) => setFixtureId(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200"
                        placeholder="Fixture ID (vide = tous)"
                    />
                    <button
                        onClick={handleInvalidateEvents}
                        disabled={cache.invalidateEvents.loading}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Quick actions */}
            <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Actions rapides</h4>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => cache.invalidateLive.execute()}
                        disabled={cache.invalidateLive.loading}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm"
                    >
                        Effacer matchs en direct
                    </button>
                    <button
                        onClick={() => cache.invalidateStandings.execute()}
                        disabled={cache.invalidateStandings.loading}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm"
                    >
                        Effacer classements
                    </button>
                    <button
                        onClick={() => cache.invalidateLineups.execute()}
                        disabled={cache.invalidateLineups.loading}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm"
                    >
                        Effacer compositions
                    </button>
                    <button
                        onClick={() => cache.invalidateOdds.execute()}
                        disabled={cache.invalidateOdds.loading}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm"
                    >
                        Effacer cotes
                    </button>
                </div>
            </div>
        </div>
    );
}
```

### 4. Integrate into Admin Dashboard

Update `src/components/admin/AdminDashboard.tsx`:

```typescript
import { CacheManager } from './CacheManager';
import { CacheControls } from './CacheControls';

export function AdminDashboard() {
    // ... existing code ...

    return (
        <div className="space-y-6">
            {/* Existing dashboard content */}
            
            {/* Add cache management section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CacheManager />
                <CacheControls />
            </div>
            
            {/* Rest of dashboard */}
        </div>
    );
}
```

## Testing Cache Invalidation

### 1. Test Fixture Cache Invalidation

```typescript
// Frontend test (from browser console)
const functions = getFunctions();
const invalidate = httpsCallable(functions, 'invalidateFixturesCache');

// Invalidate today's fixtures
const today = new Date().toISOString().split('T')[0];
await invalidate({ date: today });
console.log('Fixtures cache invalidated for', today);
```

### 2. Test Live Cache Invalidation

```typescript
const invalidateLive = httpsCallable(functions, 'invalidateLiveCache');
await invalidateLive({});
console.log('Live matches cache cleared');
```

### 3. Monitor Cache Performance

```typescript
const getCacheInfo = httpsCallable(functions, 'getCacheInfo');
const { data } = await getCacheInfo({});
console.log('Cache stats:', data.stats);
// Check hit rate, memory usage, key count
```

## Common Integration Patterns

### Pattern 1: Auto-invalidate After Manual Override

```typescript
// In MatchOverrideModal after saving
const handleSave = async () => {
    // Save override to Firestore
    await updateMatchScore(matchId, newScore);
    
    // Invalidate cache so fresh data is fetched
    await invalidateFixtures.execute({ 
        date: matchDate,
        leagueId: leagueId 
    });
    
    toast.success('Score modifié et cache invalidé');
};
```

### Pattern 2: Cache Warmup Button

```typescript
// Add to admin dashboard
const handleWarmCache = async () => {
    const today = new Date().toISOString().split('T')[0];
    const leagues = [61, 39, 140, 135, 115]; // Botola, PL, La Liga, Serie A, Ligue 1
    
    for (const league of leagues) {
        await syncFixtures({ date: today, leagueIds: [league] });
    }
    
    toast.success('Cache préchauffé avec succès');
};
```

### Pattern 3: Smart Invalidation

```typescript
// Invalidate only what's needed based on match status
const smartInvalidate = async (matchId: number, status: string) => {
    if (status === 'FINISHED') {
        // Match finished: invalidate events and lineups
        await invalidateEvents.execute({ fixtureId: matchId });
        await invalidateLineups.execute({ fixtureId: matchId });
    } else if (status.startsWith('LIVE')) {
        // Live match: only invalidate events (they change frequently)
        await invalidateEvents.execute({ fixtureId: matchId });
    }
};
```

## Best Practices

1. **Show cache status prominently** in admin dashboard
2. **Auto-refresh stats** every 30 seconds
3. **Confirm destructive actions** (clear all cache)
4. **Provide granular controls** for selective invalidation
5. **Log invalidation actions** for audit trail
6. **Toast notifications** for successful cache operations
7. **Disable buttons during operations** to prevent double-clicks

## Monitoring Alerts

Add alerts for cache health:

```typescript
useEffect(() => {
    if (stats?.enabled) {
        const hitRate = parseFloat(stats.hitRate?.replace('%', '') || '0');
        
        if (hitRate < 50) {
            toast.warning('Taux de réussite du cache faible: ' + stats.hitRate);
        }
        
        if (stats.keyCount && stats.keyCount > 10000) {
            toast.warning('Cache contient trop de clés: ' + stats.keyCount);
        }
    }
}, [stats]);
```

## Security Notes

- All cache functions require authentication
- Only admin users should access cache management UI
- Log all cache invalidation actions for audit
- Rate-limit cache operations to prevent abuse

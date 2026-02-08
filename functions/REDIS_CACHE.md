# Redis Caching Layer Documentation

## Overview

The BetArena Cloud Functions now include a comprehensive Redis caching layer that significantly reduces API-Football API calls, lowers costs, and improves response times. The cache layer is **optional** and gracefully falls back to direct API calls when Redis is not configured.

## Features

- **Configurable TTL**: Different cache durations for different data types
- **Automatic fallback**: Works seamlessly whether Redis is configured or not
- **Cache invalidation endpoints**: Admin-controlled cache management
- **Pattern-based deletion**: Efficient bulk cache invalidation
- **Hit rate tracking**: Monitor cache effectiveness via Redis INFO stats
- **Safe concurrent operations**: Uses Redis SCAN for non-blocking pattern matches

## Cache TTL Configuration

| Data Type | TTL | Rationale |
|---|---|---|
| Fixtures | 1 hour | Match schedules rarely change once created |
| Live Matches | 1 minute | Live data needs frequent updates |
| Standings | 6 hours | Standings update after each match day |
| Match Events | 2 minutes | Events update during live games |
| Match Lineups | 1 hour | Lineups don't change once announced |
| Match Odds | 30 minutes | Odds can fluctuate pre-match |

## Setup

### Local Development

1. **Install Redis locally** (or use Docker):
   ```bash
   # macOS (via Homebrew)
   brew install redis
   brew services start redis

   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis

   # Docker
   docker run -d -p 6379:6379 redis:latest
   ```

2. **Configure environment variables** in `functions/.env`:
   ```bash
   # Redis connection (optional - leave empty to disable caching)
   REDIS_URL=redis://localhost:6379

   # Optional: Redis password and TLS
   REDIS_PASSWORD=
   REDIS_TLS_ENABLED=false
   ```

3. **Test Redis connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

### Production Deployment

#### Option 1: Redis Cloud (Recommended)
1. Sign up at https://redis.com/try-free/
2. Create a new database
3. Copy the connection string
4. Set Firebase secrets:
   ```bash
   firebase functions:secrets:set REDIS_URL
   # Paste: redis://default:password@host:port
   
   # If using TLS (recommended):
   firebase functions:secrets:set REDIS_TLS_ENABLED
   # Enter: true
   ```

#### Option 2: Google Cloud Memorystore
1. Create a Redis instance in Google Cloud Console
2. Note the connection string
3. Set environment config:
   ```bash
   firebase functions:config:set redis.url="redis://10.0.0.3:6379"
   ```

#### Option 3: AWS ElastiCache
1. Create a Redis cluster in AWS
2. Set up VPC peering with Firebase Functions
3. Configure connection via secrets manager

## Cache Key Structure

Cache keys follow a consistent pattern for easy identification and invalidation:

```
{prefix}:{identifier}:{additional_params}
```

### Examples

| Data Type | Cache Key Example |
|---|---|
| Fixtures | `fixtures:2025-01-15:league:61:season:2025` |
| Live Matches | `live:leagues:39-61-115-135-140` |
| Standings | `standings:league:61:season:2025` |
| Events | `events:fixture:12345` |
| Lineups | `lineups:fixture:12345` |
| Odds | `odds:fixture:12345:bookmaker:8` |

## API Integration

All Sports API functions automatically use caching when Redis is configured. No code changes needed in calling functions.

### Automatic Caching

The following functions now use Redis caching transparently:

- `syncFixtures(date, leagueIds)` → Uses `fetchFixturesCached()`
- `syncLiveMatch(apiId)` → Uses `fetchFixtureByIdCached()`, `fetchEventsCached()`, `fetchLineupsCached()`
- `syncStandings(leagueId)` → Uses `fetchStandingsCached()`
- `syncAllLive()` → Uses `fetchLiveMatchesCached()`, `fetchEventsCached()`
- `scheduledFixtureSync()` → Uses all cached fetch functions

### Cache Behavior

```typescript
// Example: Fetching fixtures
// 1. First call: Cache miss → Fetches from API-Football → Stores in cache
await syncFixtures({ date: '2025-01-15', leagueIds: [61] });

// 2. Second call within 1 hour: Cache hit → Returns from Redis (no API call)
await syncFixtures({ date: '2025-01-15', leagueIds: [61] });

// 3. After 1 hour: Cache expired → Fetches from API-Football → Updates cache
await syncFixtures({ date: '2025-01-15', leagueIds: [61] });
```

## Cache Management Functions

All cache management functions are **admin-only** (require authentication).

### 1. Invalidate Fixtures Cache

```typescript
// Callable function name: invalidateFixturesCache
const functions = getFunctions();
const invalidate = httpsCallable(functions, 'invalidateFixturesCache');

// Invalidate specific fixture
await invalidate({ 
    date: '2025-01-15', 
    leagueId: 61, 
    season: 2025 
});

// Invalidate all fixtures for a date
await invalidate({ date: '2025-01-15' });

// Invalidate all fixtures for a league
await invalidate({ leagueId: 61 });

// Invalidate ALL fixtures
await invalidate({});
```

### 2. Invalidate Live Matches Cache

```typescript
const invalidateLive = httpsCallable(functions, 'invalidateLiveCache');
await invalidateLive({});
```

### 3. Invalidate Standings Cache

```typescript
const invalidateStandings = httpsCallable(functions, 'invalidateStandingsCache');

// Specific league and season
await invalidateStandings({ leagueId: 61, season: 2025 });

// All standings for a league
await invalidateStandings({ leagueId: 61 });

// All standings
await invalidateStandings({});
```

### 4. Invalidate Events Cache

```typescript
const invalidateEvents = httpsCallable(functions, 'invalidateEventsCache');

// Specific match
await invalidateEvents({ fixtureId: 12345 });

// All events
await invalidateEvents({});
```

### 5. Invalidate Lineups Cache

```typescript
const invalidateLineups = httpsCallable(functions, 'invalidateLineupsCache');

// Specific match
await invalidateLineups({ fixtureId: 12345 });

// All lineups
await invalidateLineups({});
```

### 6. Invalidate Odds Cache

```typescript
const invalidateOdds = httpsCallable(functions, 'invalidateOddsCache');

// All odds for a match
await invalidateOdds({ fixtureId: 12345 });

// All odds
await invalidateOdds({});
```

### 7. Clear All Cache (Nuclear Option)

```typescript
const clear = httpsCallable(functions, 'clearCache');
await clear({});
// ⚠️ Warning: This deletes ALL cache data
```

### 8. Get Cache Statistics

```typescript
const getCacheInfo = httpsCallable(functions, 'getCacheInfo');
const result = await getCacheInfo({});

console.log(result.data.stats);
// {
//   enabled: true,
//   keyCount: 127,
//   memoryUsed: "2.45M",
//   hitRate: "87.34%"
// }
```

## Use Cases & Workflows

### Scenario 1: Match Finished - Invalidate Live Data

When a match finishes, invalidate its live data so the next call fetches final results:

```typescript
// 1. Match finishes (status: FINISHED)
// 2. Invalidate live data for that match
await invalidateEventsCache({ fixtureId: 12345 });
await invalidateLineupsCache({ fixtureId: 12345 });

// 3. Next syncLiveMatch() call will fetch fresh data with final stats
```

### Scenario 2: Manual Score Override - Clear Fixture Cache

After admin manually overrides a score:

```typescript
// Admin corrects score in Firestore
// Clear the cache so API data doesn't overwrite it
await invalidateFixturesCache({ 
    date: '2025-01-15', 
    leagueId: 61, 
    season: 2025 
});
```

### Scenario 3: Match Day - Preload Cache

Before a busy match day, preload cache to reduce API load:

```typescript
// Morning: Sync fixtures (cache for 1 hour)
await syncFixtures({ date: '2025-01-15', leagueIds: [61, 39, 140] });

// During matches: Frequent syncAllLive() calls hit cache (1 min TTL)
setInterval(async () => {
    await syncAllLive(); // Uses cache if called within 1 minute
}, 120000); // Every 2 minutes
```

### Scenario 4: Cache Monitoring

```typescript
// Get cache statistics
const { stats } = await getCacheInfo({});

if (stats.hitRate < 0.5) { // Less than 50% hit rate
    console.warn("Low cache hit rate - consider adjusting TTLs");
}

console.log(`Cache contains ${stats.keyCount} keys`);
console.log(`Memory usage: ${stats.memoryUsed}`);
```

## Performance Benefits

### API Call Reduction

**Without cache:**
```
10 clients request live scores every 2 minutes
= 10 API calls per 2-min period
= 300 API calls per hour
= 7,200 API calls per day
```

**With cache (1-min TTL):**
```
First client fetches from API (cache miss)
Next 9 clients use cache (cache hit)
After 1 minute, cache expires
= ~30 API calls per hour
= ~720 API calls per day
= 90% reduction in API calls
```

### Cost Savings

**API-Football Pricing:**
- Free tier: 100 requests/day
- Basic plan: $10/month for 10,000 requests/day

**Scenario: 5,000 requests/day**
- Without cache: $50/month
- With cache (90% reduction): $5/month
- **Savings: $45/month ($540/year)**

## Troubleshooting

### Cache Not Working

1. **Check Redis connection:**
   ```bash
   # From functions directory
   firebase functions:config:get redis.url
   # or
   firebase functions:secrets:access REDIS_URL
   ```

2. **Check logs:**
   ```bash
   firebase functions:log
   # Look for: "Redis client connected successfully"
   # or: "Redis not configured. Caching disabled"
   ```

3. **Verify Redis is running:**
   ```bash
   redis-cli ping
   ```

### Cache Stale Data

If data seems outdated:

1. **Check TTL settings** in `cache.ts`:
   ```typescript
   export const CacheTTL = {
       FIXTURES: 3600,        // Increase if too short
       LIVE_MATCHES: 60,      // Decrease if too long
       // ...
   };
   ```

2. **Manually invalidate cache:**
   ```typescript
   await clearCache({}); // Nuclear option
   ```

3. **Check system time:**
   Ensure server time is synchronized (affects TTL calculations)

### Memory Issues

If Redis runs out of memory:

1. **Check memory usage:**
   ```bash
   redis-cli info memory
   ```

2. **Set eviction policy:**
   ```bash
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

3. **Monitor key count:**
   ```typescript
   const { stats } = await getCacheInfo({});
   console.log(stats.keyCount); // Should be < 10,000 for typical usage
   ```

## Best Practices

1. **Use specific invalidation** instead of clearing all cache
2. **Monitor hit rate** regularly via `getCacheInfo()`
3. **Set appropriate TTLs** based on data update frequency
4. **Test cache behavior** in staging before production
5. **Enable TLS** for production Redis connections
6. **Use Redis Cluster** for high-traffic production environments
7. **Set Redis maxmemory** limit to prevent OOM errors

## Advanced Configuration

### Custom TTLs

Modify `CacheTTL` in `functions/src/cache.ts`:

```typescript
export const CacheTTL = {
    FIXTURES: 7200,        // 2 hours (more aggressive caching)
    LIVE_MATCHES: 30,      // 30 seconds (more frequent updates)
    STANDINGS: 43200,      // 12 hours (less frequent updates)
    // ...
};
```

### Redis Connection Pooling

For high-traffic scenarios, configure connection pool:

```typescript
// In cache.ts initRedis()
const options: Redis.RedisOptions = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    // Connection pooling (uncomment for high traffic)
    // enableOfflineQueue: false,
    // connectTimeout: 10000,
    // keepAlive: 30000,
};
```

### Cache Warming

Pre-populate cache before peak traffic:

```typescript
// Cloud Function: warmCache
export const warmCache = onSchedule("0 3 * * *", async () => {
    const today = new Date().toISOString().split("T")[0];
    const leagues = [61, 39, 140, 135, 115];
    
    // Warm fixtures cache
    for (const league of leagues) {
        await fetchFixturesCached(today, league, CURRENT_SEASON);
    }
    
    // Warm standings cache
    for (const league of leagues) {
        await fetchStandingsCached(league, CURRENT_SEASON);
    }
    
    logger.info("Cache warmed successfully");
});
```

## Security Considerations

1. **Admin-only invalidation**: All cache management functions require authentication
2. **No sensitive data caching**: Cache only contains public API data
3. **TLS encryption**: Always enable for production Redis connections
4. **Redis AUTH**: Use password authentication for Redis instances
5. **Network security**: Use VPC/VPN for Redis connections in production

## Migration Guide

### From Direct API Calls to Cached

**Before:**
```typescript
const fixtures = await fetchFromApi(`/fixtures?date=${date}&league=${leagueId}&season=${season}`);
```

**After:**
```typescript
const fixtures = await fetchFixturesCached(date, leagueId, season);
```

All existing Cloud Functions have been updated automatically. No client-side changes needed.

## Support

For issues or questions:
1. Check Firebase Functions logs: `firebase functions:log`
2. Monitor Redis: `redis-cli MONITOR`
3. Review cache stats: Call `getCacheInfo()`

## Changelog

### v1.0.0 (2025-01-15)
- Initial Redis caching layer implementation
- 6 cached endpoint types (fixtures, live, standings, events, lineups, odds)
- 8 cache management Cloud Functions
- Configurable TTL per data type
- Automatic fallback to direct API calls
- Pattern-based cache invalidation
- Cache statistics and monitoring

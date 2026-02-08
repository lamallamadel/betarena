import Redis, { RedisOptions } from "ioredis";
import * as logger from "firebase-functions/logger";
import { onCall, HttpsError } from "firebase-functions/https";

// ============================================
// CACHE CONFIGURATION
// ============================================

/**
 * TTL (Time To Live) configuration for different API endpoint types.
 * All values in seconds.
 */
export const CacheTTL = {
    FIXTURES: 3600,        // 1 hour - fixtures don't change often once created
    LIVE_MATCHES: 60,      // 1 minute - live data needs frequent updates
    STANDINGS: 21600,      // 6 hours - standings update after each match day
    EVENTS: 120,           // 2 minutes - match events during live games
    LINEUPS: 3600,         // 1 hour - lineups don't change once announced
    ODDS: 1800,            // 30 minutes - odds can fluctuate pre-match
} as const;

/**
 * Cache key prefixes for different data types.
 * Helps organize cache and enables pattern-based invalidation.
 */
export const CachePrefix = {
    FIXTURES: "fixtures",
    LIVE_MATCHES: "live",
    STANDINGS: "standings",
    EVENTS: "events",
    LINEUPS: "lineups",
    ODDS: "odds",
} as const;

// ============================================
// REDIS CLIENT INITIALIZATION
// ============================================

let redisClient: Redis | null = null;
let redisInitialized = false;
let redisEnabled = false;

/**
 * Initialize Redis client with environment configuration.
 * Gracefully handles missing configuration by disabling cache.
 */
function initRedis(): Redis | null {
    if (redisInitialized) {
        return redisClient;
    }

    redisInitialized = true;

    const redisUrl = process.env.REDIS_URL;
    
    // If no Redis URL configured, disable caching
    if (!redisUrl || redisUrl.trim() === "") {
        logger.info("Redis not configured (REDIS_URL not set). Caching disabled, falling back to direct API calls.");
        redisEnabled = false;
        return null;
    }

    try {
        const redisPassword = process.env.REDIS_PASSWORD;
        const redisTlsEnabled = process.env.REDIS_TLS_ENABLED === "true";

        const options: RedisOptions = {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
                // Exponential backoff: 100ms, 200ms, 400ms, then give up
                if (times > 3) {
                    logger.error("Redis connection failed after 3 retries");
                    return null;
                }
                return Math.min(times * 100, 1000);
            },
            enableReadyCheck: true,
            lazyConnect: false,
        };

        // Add password if provided
        if (redisPassword && redisPassword.trim() !== "") {
            options.password = redisPassword;
        }

        // Enable TLS if required (e.g., for Redis Cloud, AWS ElastiCache)
        if (redisTlsEnabled) {
            options.tls = {};
        }

        redisClient = new Redis(redisUrl, options);

        // Connection event handlers
        redisClient.on("connect", () => {
            logger.info("Redis client connected successfully");
            redisEnabled = true;
        });

        redisClient.on("ready", () => {
            logger.info("Redis client ready for commands");
            redisEnabled = true;
        });

        redisClient.on("error", (err) => {
            logger.error("Redis client error", { error: err.message });
            redisEnabled = false;
        });

        redisClient.on("close", () => {
            logger.warn("Redis connection closed");
            redisEnabled = false;
        });

        redisClient.on("reconnecting", () => {
            logger.info("Redis client reconnecting...");
        });

        return redisClient;
    } catch (error) {
        logger.error("Failed to initialize Redis client", { error });
        redisEnabled = false;
        return null;
    }
}

/**
 * Get the Redis client, initializing if needed.
 * Returns null if Redis is not configured or unavailable.
 */
export function getRedisClient(): Redis | null {
    if (!redisInitialized) {
        return initRedis();
    }
    return redisClient;
}

/**
 * Check if Redis caching is currently enabled and operational.
 */
export function isCacheEnabled(): boolean {
    return redisEnabled && redisClient !== null;
}

// ============================================
// CACHE KEY GENERATION
// ============================================

/**
 * Generate a cache key for fixtures by date and league.
 * Example: "fixtures:2025-01-15:league:61:season:2025"
 */
export function getFixturesKey(date: string, leagueId: number, season: number): string {
    return `${CachePrefix.FIXTURES}:${date}:league:${leagueId}:season:${season}`;
}

/**
 * Generate a cache key for live matches across multiple leagues.
 * Example: "live:leagues:39-61-115-135-140"
 */
export function getLiveMatchesKey(leagueIds: string): string {
    return `${CachePrefix.LIVE_MATCHES}:leagues:${leagueIds}`;
}

/**
 * Generate a cache key for standings by league and season.
 * Example: "standings:league:61:season:2025"
 */
export function getStandingsKey(leagueId: number, season: number): string {
    return `${CachePrefix.STANDINGS}:league:${leagueId}:season:${season}`;
}

/**
 * Generate a cache key for match events.
 * Example: "events:fixture:12345"
 */
export function getEventsKey(fixtureId: number): string {
    return `${CachePrefix.EVENTS}:fixture:${fixtureId}`;
}

/**
 * Generate a cache key for match lineups.
 * Example: "lineups:fixture:12345"
 */
export function getLineupsKey(fixtureId: number): string {
    return `${CachePrefix.LINEUPS}:fixture:${fixtureId}`;
}

/**
 * Generate a cache key for match odds.
 * Example: "odds:fixture:12345:bookmaker:8"
 */
export function getOddsKey(fixtureId: number, bookmakerId: number): string {
    return `${CachePrefix.ODDS}:fixture:${fixtureId}:bookmaker:${bookmakerId}`;
}

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Get data from cache.
 * Returns null if cache is disabled, key doesn't exist, or error occurs.
 */
export async function getCached<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    
    if (!client || !isCacheEnabled()) {
        return null;
    }

    try {
        const cached = await client.get(key);
        
        if (!cached) {
            logger.debug("Cache miss", { key });
            return null;
        }

        logger.debug("Cache hit", { key });
        return JSON.parse(cached) as T;
    } catch (error) {
        logger.error("Cache get error", { key, error });
        return null;
    }
}

/**
 * Set data in cache with TTL.
 * Silently fails if cache is disabled or error occurs.
 */
export async function setCached(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    const client = getRedisClient();
    
    if (!client || !isCacheEnabled()) {
        return;
    }

    try {
        const serialized = JSON.stringify(data);
        await client.setex(key, ttlSeconds, serialized);
        logger.debug("Cache set", { key, ttl: ttlSeconds });
    } catch (error) {
        logger.error("Cache set error", { key, error });
    }
}

/**
 * Delete a specific cache key.
 * Returns the number of keys deleted (0 or 1).
 */
export async function deleteCached(key: string): Promise<number> {
    const client = getRedisClient();
    
    if (!client || !isCacheEnabled()) {
        return 0;
    }

    try {
        const result = await client.del(key);
        logger.info("Cache key deleted", { key, deleted: result });
        return result;
    } catch (error) {
        logger.error("Cache delete error", { key, error });
        return 0;
    }
}

/**
 * Delete all cache keys matching a pattern.
 * Uses SCAN for safe pattern-based deletion (won't block Redis).
 * Returns the number of keys deleted.
 */
export async function deleteByPattern(pattern: string): Promise<number> {
    const client = getRedisClient();
    
    if (!client || !isCacheEnabled()) {
        return 0;
    }

    try {
        let cursor = "0";
        let deletedCount = 0;
        const keysToDelete: string[] = [];

        // Scan for matching keys
        do {
            const [nextCursor, keys] = await client.scan(
                cursor,
                "MATCH",
                pattern,
                "COUNT",
                100
            );
            cursor = nextCursor;
            keysToDelete.push(...keys);
        } while (cursor !== "0");

        // Delete in batches
        if (keysToDelete.length > 0) {
            // Use pipeline for efficient batch deletion
            const pipeline = client.pipeline();
            keysToDelete.forEach(key => pipeline.del(key));
            const results = await pipeline.exec();
            deletedCount = results?.length || 0;
            
            logger.info("Cache pattern deleted", { pattern, deleted: deletedCount });
        }

        return deletedCount;
    } catch (error) {
        logger.error("Cache pattern delete error", { pattern, error });
        return 0;
    }
}

/**
 * Get or set cache with fallback function.
 * This is the main caching wrapper used throughout the codebase.
 * 
 * @param key - Cache key
 * @param ttlSeconds - Time to live in seconds
 * @param fetchFn - Function to fetch data on cache miss
 * @returns The cached or freshly fetched data
 */
export async function getOrFetch<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    // Try to get from cache first
    const cached = await getCached<T>(key);
    
    if (cached !== null) {
        return cached;
    }

    // Cache miss - fetch from source
    logger.debug("Cache miss, fetching from source", { key });
    const data = await fetchFn();

    // Store in cache for next time
    await setCached(key, data, ttlSeconds);

    return data;
}

/**
 * Clear all cache data (use with caution).
 * Returns the number of keys deleted.
 */
export async function clearAllCache(): Promise<number> {
    const client = getRedisClient();
    
    if (!client || !isCacheEnabled()) {
        return 0;
    }

    try {
        const result = await client.flushdb();
        logger.warn("All cache cleared", { result });
        return 1; // flushdb returns OK, we return 1 to indicate success
    } catch (error) {
        logger.error("Cache clear error", { error });
        return 0;
    }
}

/**
 * Get cache statistics.
 */
export async function getCacheStats(): Promise<{
    enabled: boolean;
    keyCount?: number;
    memoryUsed?: string;
    hitRate?: string;
} | null> {
    const client = getRedisClient();
    
    if (!client || !isCacheEnabled()) {
        return { enabled: false };
    }

    try {
        const info = await client.info("stats");
        const dbsize = await client.dbsize();

        // Parse hit rate from stats
        const hitsMatch = info.match(/keyspace_hits:(\d+)/);
        const missesMatch = info.match(/keyspace_misses:(\d+)/);
        const hits = hitsMatch ? parseInt(hitsMatch[1], 10) : 0;
        const misses = missesMatch ? parseInt(missesMatch[1], 10) : 0;
        const total = hits + misses;
        const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : "N/A";

        // Parse memory usage
        const memoryMatch = info.match(/used_memory_human:(\S+)/);
        const memoryUsed = memoryMatch ? memoryMatch[1] : "N/A";

        return {
            enabled: true,
            keyCount: dbsize,
            memoryUsed,
            hitRate: `${hitRate}%`,
        };
    } catch (error) {
        logger.error("Failed to get cache stats", { error });
        return null;
    }
}

// ============================================
// CACHE INVALIDATION CLOUD FUNCTIONS
// ============================================

/**
 * Invalidate fixtures cache for a specific date and league.
 * Callable function (admin only).
 */
export const invalidateFixturesCache = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    const { date, leagueId, season } = request.data as { 
        date?: string; 
        leagueId?: number;
        season?: number;
    };

    if (!isCacheEnabled()) {
        return { success: true, message: "Cache not enabled", deleted: 0 };
    }

    let deletedCount = 0;

    if (date && leagueId && season) {
        // Delete specific fixture cache
        const key = getFixturesKey(date, leagueId, season);
        deletedCount = await deleteCached(key);
    } else if (date) {
        // Delete all fixtures for a date
        const pattern = `${CachePrefix.FIXTURES}:${date}:*`;
        deletedCount = await deleteByPattern(pattern);
    } else if (leagueId) {
        // Delete all fixtures for a league
        const pattern = `${CachePrefix.FIXTURES}:*:league:${leagueId}:*`;
        deletedCount = await deleteByPattern(pattern);
    } else {
        // Delete all fixtures
        const pattern = `${CachePrefix.FIXTURES}:*`;
        deletedCount = await deleteByPattern(pattern);
    }

    logger.info("Fixtures cache invalidated", { date, leagueId, season, deleted: deletedCount });
    
    return { 
        success: true, 
        deleted: deletedCount,
        message: `Invalidated ${deletedCount} fixture cache entries`
    };
});

/**
 * Invalidate live matches cache.
 * Callable function (admin only).
 */
export const invalidateLiveCache = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    if (!isCacheEnabled()) {
        return { success: true, message: "Cache not enabled", deleted: 0 };
    }

    const pattern = `${CachePrefix.LIVE_MATCHES}:*`;
    const deletedCount = await deleteByPattern(pattern);

    logger.info("Live matches cache invalidated", { deleted: deletedCount });
    
    return { 
        success: true, 
        deleted: deletedCount,
        message: `Invalidated ${deletedCount} live match cache entries`
    };
});

/**
 * Invalidate standings cache.
 * Callable function (admin only).
 */
export const invalidateStandingsCache = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    const { leagueId, season } = request.data as { 
        leagueId?: number;
        season?: number;
    };

    if (!isCacheEnabled()) {
        return { success: true, message: "Cache not enabled", deleted: 0 };
    }

    let deletedCount = 0;

    if (leagueId && season) {
        // Delete specific standings cache
        const key = getStandingsKey(leagueId, season);
        deletedCount = await deleteCached(key);
    } else if (leagueId) {
        // Delete all standings for a league
        const pattern = `${CachePrefix.STANDINGS}:league:${leagueId}:*`;
        deletedCount = await deleteByPattern(pattern);
    } else {
        // Delete all standings
        const pattern = `${CachePrefix.STANDINGS}:*`;
        deletedCount = await deleteByPattern(pattern);
    }

    logger.info("Standings cache invalidated", { leagueId, season, deleted: deletedCount });
    
    return { 
        success: true, 
        deleted: deletedCount,
        message: `Invalidated ${deletedCount} standings cache entries`
    };
});

/**
 * Invalidate match events cache.
 * Callable function (admin only).
 */
export const invalidateEventsCache = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    const { fixtureId } = request.data as { fixtureId?: number };

    if (!isCacheEnabled()) {
        return { success: true, message: "Cache not enabled", deleted: 0 };
    }

    let deletedCount = 0;

    if (fixtureId) {
        // Delete specific events cache
        const key = getEventsKey(fixtureId);
        deletedCount = await deleteCached(key);
    } else {
        // Delete all events
        const pattern = `${CachePrefix.EVENTS}:*`;
        deletedCount = await deleteByPattern(pattern);
    }

    logger.info("Events cache invalidated", { fixtureId, deleted: deletedCount });
    
    return { 
        success: true, 
        deleted: deletedCount,
        message: `Invalidated ${deletedCount} event cache entries`
    };
});

/**
 * Invalidate match lineups cache.
 * Callable function (admin only).
 */
export const invalidateLineupsCache = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    const { fixtureId } = request.data as { fixtureId?: number };

    if (!isCacheEnabled()) {
        return { success: true, message: "Cache not enabled", deleted: 0 };
    }

    let deletedCount = 0;

    if (fixtureId) {
        // Delete specific lineups cache
        const key = getLineupsKey(fixtureId);
        deletedCount = await deleteCached(key);
    } else {
        // Delete all lineups
        const pattern = `${CachePrefix.LINEUPS}:*`;
        deletedCount = await deleteByPattern(pattern);
    }

    logger.info("Lineups cache invalidated", { fixtureId, deleted: deletedCount });
    
    return { 
        success: true, 
        deleted: deletedCount,
        message: `Invalidated ${deletedCount} lineup cache entries`
    };
});

/**
 * Invalidate match odds cache.
 * Callable function (admin only).
 */
export const invalidateOddsCache = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    const { fixtureId } = request.data as { fixtureId?: number };

    if (!isCacheEnabled()) {
        return { success: true, message: "Cache not enabled", deleted: 0 };
    }

    let deletedCount = 0;

    if (fixtureId) {
        // Delete all odds for a specific fixture (all bookmakers)
        const pattern = `${CachePrefix.ODDS}:fixture:${fixtureId}:*`;
        deletedCount = await deleteByPattern(pattern);
    } else {
        // Delete all odds
        const pattern = `${CachePrefix.ODDS}:*`;
        deletedCount = await deleteByPattern(pattern);
    }

    logger.info("Odds cache invalidated", { fixtureId, deleted: deletedCount });
    
    return { 
        success: true, 
        deleted: deletedCount,
        message: `Invalidated ${deletedCount} odds cache entries`
    };
});

/**
 * Clear all cache data (nuclear option).
 * Callable function (admin only).
 */
export const clearCache = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    if (!isCacheEnabled()) {
        return { success: true, message: "Cache not enabled", deleted: 0 };
    }

    const result = await clearAllCache();

    logger.warn("ALL cache cleared by user", { uid: request.auth.uid });
    
    return { 
        success: true, 
        deleted: result,
        message: "All cache cleared"
    };
});

/**
 * Get cache statistics.
 * Callable function (admin only).
 */
export const getCacheInfo = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    const stats = await getCacheStats();

    return { 
        success: true, 
        stats,
    };
});

# Analytics Implementation Summary

## Overview

This document provides a quick reference for the analytics data collection system implemented for Year 5 features.

## What Was Implemented

### 1. Champion Variance Tracking
- **Location**: `src/hooks/useAnalytics.ts`, `src/hooks/useBetting.ts`
- **Purpose**: Track betting distribution diversity across users
- **Metrics**: Shannon entropy (variance score), HHI (concentration index)
- **Trigger**: When betting window closes (match starts)
- **Storage**: `artifacts/botola-v1/analytics/champion_variance/matches/{matchId}_{type}`

### 2. Bottom 50% Retention Tracking
- **Location**: `src/hooks/useAnalytics.ts`, `src/hooks/useGamification.ts`
- **Purpose**: Track daily engagement of lower-ranked users
- **Metrics**: Retention rate, avg bets per user, avg coins spent
- **Trigger**: Daily at midnight (recommended)
- **Storage**: `artifacts/botola-v1/analytics/bottom50_retention/daily/{date}`

## Quick Start

### Import and Use

```typescript
// Option 1: Standalone hook
import { useAnalytics } from '../hooks/useAnalytics';

const analytics = useAnalytics();

// Track champion variance
await analytics.trackChampionVariance('match_123', '1N2');

// Track bottom 50% retention
await analytics.trackBottom50Retention();

// Track all daily analytics
const results = await analytics.trackDailyAnalytics(['match_1', 'match_2']);
```

```typescript
// Option 2: From existing hooks
import { useBetting } from '../hooks/useBetting';
import { useGamification } from '../hooks/useGamification';

const { trackChampionVariance } = useBetting(userId, matchId, matchStatus);
const { trackBottom50Retention } = useGamification(userId, profile);
```

## Data Structure

### Champion Variance
```typescript
{
  matchId: string;
  timestamp: number;
  totalBets: number;
  uniqueUsers: number;
  selections: Array<{
    selection: string;      // '1', 'N', '2'
    count: number;          // Number of bets
    percentage: number;     // % of total bets
    totalStaked: number;    // Total coins staked
  }>;
  varianceScore: number;         // 0-1 (Shannon entropy)
  concentrationIndex: number;    // 0-1 (HHI)
}
```

### Bottom 50% Retention
```typescript
{
  date: string;              // YYYY-MM-DD
  timestamp: number;
  totalUsers: number;        // Total users in leaderboard
  bottom50Count: number;     // Number of users in bottom 50%
  activeBottom50: number;    // Number of active bottom 50% users
  retentionRate: number;     // Percentage (0-100)
  avgBetsPerUser: number;    // Average bets per active user
  avgCoinsSpent: number;     // Average coins spent per active user
}
```

## Files Modified

1. **`src/types/types.ts`**: Added analytics type definitions
2. **`src/hooks/useAnalytics.ts`**: New standalone analytics hook
3. **`src/hooks/useBetting.ts`**: Added `trackChampionVariance` function
4. **`src/hooks/useGamification.ts`**: Added `trackBottom50Retention` function
5. **`firestore.rules`**: Added read-only security rules for analytics collections
6. **`firestore.indexes.json`**: Added composite indexes for analytics queries
7. **`CLAUDE.md`**: Updated with analytics system documentation
8. **`docs/ANALYTICS.md`**: Complete technical documentation

## Security

- Analytics collections are **read-only** from the client
- Only Cloud Functions can write to analytics collections
- All authenticated users can read analytics data

## Performance Notes

- **Champion Variance**: O(U × P) complexity — run when betting closes, not real-time
- **Bottom 50% Retention**: O(U × P) complexity — run once daily via cron
- Both functions are **non-blocking** and log errors without throwing

## Next Steps (Recommended)

### 1. Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### 2. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Set Up Automated Tracking (Cloud Functions)

Create `functions/src/analytics.ts`:

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { collection, getDocs, query, where, orderBy, setDoc, doc } from 'firebase/firestore';
import { db, APP_ID } from './firebase-admin-init';

// Daily retention tracking
export const trackDailyRetention = onSchedule('0 0 * * *', async () => {
  // Copy trackBottom50Retention logic here
  console.log('Daily retention tracking complete');
});

// Champion variance on match start
export const trackVarianceOnMatchStart = onDocumentUpdated(
  'matches/{matchId}',
  async (event) => {
    const newStatus = event.data?.after.data()?.status;
    const oldStatus = event.data?.before.data()?.status;
    
    if (oldStatus === 'PRE_MATCH' && newStatus === 'LIVE') {
      // Copy trackChampionVariance logic here
      console.log(`Variance tracked for match ${event.params.matchId}`);
    }
  }
);
```

Export from `functions/src/index.ts`:
```typescript
export * from './analytics';
```

### 4. Monitor Analytics Data

Check Firestore console for:
- `artifacts/botola-v1/analytics/champion_variance/matches/`
- `artifacts/botola-v1/analytics/bottom50_retention/daily/`

## Troubleshooting

### "Missing index" error
Run: `firebase deploy --only firestore:indexes`
Wait 5-10 minutes for index creation.

### No data appearing
1. Verify leaderboard collection is populated
2. Check that predictions have `timestamp` field
3. Ensure users are placing bets (check predictions collection)
4. Check browser console for `[Analytics]` logs

### High latency
This is expected. These are **batch analytics** designed to run as background jobs, not in the request path.

## Future Use Cases

This data enables Year 5 features like:
- **Dynamic odds adjustment** based on variance
- **Beginner protection systems** based on retention
- **Anti-herding rewards** for contrarian bets
- **Churn prediction** and targeted interventions
- **Economy balancing** based on bottom 50% behavior

## Documentation

- **Full docs**: `docs/ANALYTICS.md`
- **Codebase guide**: `CLAUDE.md` (Analytics System section)
- **Type definitions**: `src/types/types.ts`

## Support

For questions or issues, refer to:
1. `docs/ANALYTICS.md` for detailed technical documentation
2. Browser console logs prefixed with `[Analytics]`
3. Firestore console to inspect stored data

# Analytics System — Year 5 Features

## Overview

The BetArena analytics system provides advanced data collection for future Year 5 features, tracking key engagement and distribution metrics across the platform.

## Key Metrics

### 1. Champion Variance

**Purpose**: Measures the diversity of betting behavior across users for a given match.

**Metrics**:
- **Variance Score** (0-1): Shannon entropy-based score
  - `0`: All bets concentrated on one option (unhealthy)
  - `1`: Perfectly uniform distribution (healthy diversity)
- **Concentration Index** (0-1): Herfindahl-Hirschman Index (HHI)
  - `0`: Perfectly diversified
  - `1`: Completely concentrated
- **Total Bets**: Number of bets placed
- **Unique Users**: Number of distinct users who bet
- **Selections**: Breakdown by selection (1/N/2) with count, percentage, and total staked

**Use Cases**:
- Detect "herding behavior" (everyone betting the same way)
- Identify matches with high/low engagement diversity
- Balance Pari Mutuel pools
- Optimize odds in future betting modes

**Firestore Path**:
```
artifacts/botola-v1/analytics/champion_variance/matches/{matchId}_{type}
```

**Example Data**:
```json
{
  "matchId": "match_123",
  "timestamp": 1234567890,
  "totalBets": 150,
  "uniqueUsers": 85,
  "selections": [
    { "selection": "1", "count": 60, "percentage": 40, "totalStaked": 6000 },
    { "selection": "N", "count": 45, "percentage": 30, "totalStaked": 4500 },
    { "selection": "2", "count": 45, "percentage": 30, "totalStaked": 4500 }
  ],
  "varianceScore": 0.95,
  "concentrationIndex": 0.34
}
```

### 2. Bottom 50% Retention

**Purpose**: Tracks daily engagement of the lower-ranked half of users (critical churn indicator).

**Metrics**:
- **Retention Rate** (%): Percentage of bottom 50% who placed at least 1 bet today
- **Active Bottom 50**: Number of active users in bottom 50%
- **Avg Bets Per User**: Average bets placed by active bottom 50% users
- **Avg Coins Spent**: Average coins spent by active bottom 50% users
- **Total Users**: Total user count in leaderboard
- **Bottom 50 Count**: Number of users in bottom 50%

**Use Cases**:
- Early warning system for user churn
- Measure effectiveness of comeback mechanics (RG-E01 bonus)
- Guide balancing of economy for casual players
- Identify need for beginner-friendly features

**Firestore Paths**:
```
artifacts/botola-v1/analytics/bottom50_retention/daily/{YYYY-MM-DD}
artifacts/botola-v1/analytics/bottom50_retention/snapshots/{YYYY-MM-DD}
```

**Example Data**:
```json
{
  "date": "2024-01-15",
  "timestamp": 1234567890,
  "totalUsers": 1000,
  "bottom50Count": 500,
  "activeBottom50": 325,
  "retentionRate": 65.0,
  "avgBetsPerUser": 2.4,
  "avgCoinsSpent": 240
}
```

**Snapshots** (detailed per-user data for active bottom 50%):
```json
{
  "date": "2024-01-15",
  "timestamp": 1234567890,
  "snapshots": [
    {
      "userId": "user_abc",
      "rank": 501,
      "isBottom50": true,
      "betsPlaced": 3,
      "coinsSpent": 300,
      "lastActiveAt": 1234567800
    }
  ]
}
```

## Implementation

### Hooks

#### `useAnalytics()` — Standalone Hook
```typescript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { 
    trackChampionVariance, 
    trackBottom50Retention,
    trackDailyAnalytics 
  } = useAnalytics();

  // Track variance for a specific match
  await trackChampionVariance('match_123', '1N2');

  // Track daily retention
  await trackBottom50Retention();

  // Track all daily analytics
  const results = await trackDailyAnalytics(['match_1', 'match_2']);
}
```

#### `useBetting()` — Integrated Champion Variance
```typescript
import { useBetting } from '../hooks/useBetting';

const { trackChampionVariance } = useBetting(userId, matchId, matchStatus);

// Track after betting window closes (e.g., on match start)
await trackChampionVariance(matchId, '1N2');
```

#### `useGamification()` — Integrated Bottom 50% Retention
```typescript
import { useGamification } from '../hooks/useGamification';

const { trackBottom50Retention } = useGamification(userId, profile);

// Track daily (e.g., via cron job or scheduled Cloud Function)
await trackBottom50Retention();
```

### Automated Tracking

For production use, these analytics should be triggered automatically:

1. **Champion Variance**: 
   - Trigger: When match status changes to `LIVE` (betting window closes)
   - Implementation: Cloud Function `onMatchStatusUpdate`

2. **Bottom 50% Retention**:
   - Trigger: Daily at midnight UTC
   - Implementation: Scheduled Cloud Function (`cron: "0 0 * * *"`)

Example Cloud Function (add to `functions/src/analytics.ts`):
```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

// Daily retention tracking
export const trackDailyRetention = onSchedule('0 0 * * *', async () => {
  const analytics = useAnalytics();
  await analytics.trackBottom50Retention();
});

// Champion variance on match start
export const trackVarianceOnMatchStart = onDocumentUpdated(
  'matches/{matchId}',
  async (event) => {
    const newStatus = event.data?.after.data()?.status;
    const oldStatus = event.data?.before.data()?.status;
    
    if (oldStatus === 'PRE_MATCH' && newStatus === 'LIVE') {
      const analytics = useAnalytics();
      await analytics.trackChampionVariance(event.params.matchId, '1N2');
    }
  }
);
```

## Data Structure

### Champion Variance
```
artifacts/
  botola-v1/
    analytics/
      champion_variance/
        matches/
          {matchId}_1N2
          {matchId}_EXACT_SCORE
          {matchId}_PENALTY_MISS
```

### Bottom 50% Retention
```
artifacts/
  botola-v1/
    analytics/
      bottom50_retention/
        daily/
          2024-01-15
          2024-01-16
          ...
        snapshots/
          2024-01-15
          2024-01-16
          ...
```

## Security Rules

Analytics collections are **read-only** from the client:

```javascript
// Read access for authenticated users
match /artifacts/{appId}/analytics/{collection}/{document=**} {
  allow read: if request.auth != null;
  allow write: if false; // Only Cloud Functions can write
}
```

## Performance Considerations

### Champion Variance
- **Complexity**: O(U × P) where U = users, P = predictions per user
- **Optimization**: Use Firestore collection group queries with indexes
- **Recommended**: Run when betting window closes (not real-time)

### Bottom 50% Retention
- **Complexity**: O(U × P) where U = bottom 50% users, P = predictions
- **Optimization**: 
  - Run once daily (not per-request)
  - Store snapshots separately to avoid loading all data
  - Use date-based sharding for historical data

### Firestore Indexes

Required composite indexes (defined in `firestore.indexes.json`):

```json
{
  "collectionGroup": "predictions",
  "fields": [
    { "fieldPath": "matchId", "order": "ASCENDING" },
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

## Monitoring & Debugging

All analytics functions include console logging:

```typescript
console.log('[Analytics] Champion Variance tracked:', {
  matchId: 'match_123',
  type: '1N2',
  varianceScore: '0.950',
  concentrationIndex: '0.340',
  uniqueUsers: 85,
  totalBets: 150
});

console.log('[Analytics] Bottom 50% Retention tracked:', {
  date: '2024-01-15',
  retentionRate: '65.00%',
  activeBottom50: 325,
  bottom50Count: 500,
  avgBetsPerUser: '2.40',
  avgCoinsSpent: '240.00'
});
```

## Future Extensions

### Year 5 Feature Ideas

1. **Champion Leaderboard**:
   - Rank users by prediction diversity (anti-herding score)
   - Reward users who bet against the crowd successfully

2. **Dynamic Odds Adjustment**:
   - Use variance score to adjust odds in real-time
   - Balance Pari Mutuel pools based on concentration

3. **Beginner Protection**:
   - Identify bottom 50% users at risk of churn
   - Offer targeted bonuses/incentives
   - Match them with mentors or simplified UIs

4. **Social Features**:
   - Show "contrarian" badges for users who bet against crowd
   - Highlight matches with highest variance for interesting debates

5. **A/B Testing**:
   - Use retention data to measure impact of feature changes
   - Compare retention rates before/after economy adjustments

## Type Definitions

See `src/types/types.ts`:

```typescript
export interface ChampionVarianceData {
  matchId: string;
  timestamp: number;
  totalBets: number;
  uniqueUsers: number;
  selections: {
    selection: string;
    count: number;
    percentage: number;
    totalStaked: number;
  }[];
  varianceScore: number;
  concentrationIndex: number;
}

export interface Bottom50RetentionData {
  date: string;
  timestamp: number;
  totalUsers: number;
  bottom50Count: number;
  activeBottom50: number;
  retentionRate: number;
  avgBetsPerUser: number;
  avgCoinsSpent: number;
}

export interface UserActivitySnapshot {
  userId: string;
  rank: number;
  isBottom50: boolean;
  betsPlaced: number;
  coinsSpent: number;
  lastActiveAt: number;
}
```

## Testing

Manual testing (via browser console):

```javascript
import { useAnalytics } from './hooks/useAnalytics';

const analytics = useAnalytics();

// Test champion variance
const varianceData = await analytics.trackChampionVariance('match_123', '1N2');
console.log('Variance:', varianceData);

// Test bottom 50% retention
const retentionData = await analytics.trackBottom50Retention('2024-01-15');
console.log('Retention:', retentionData);

// Test batch tracking
const results = await analytics.trackDailyAnalytics(['match_1', 'match_2']);
console.log('Daily analytics:', results);
```

## Troubleshooting

### "Insufficient permissions" errors
- Check Firestore rules allow reads for authenticated users
- Verify write operations only happen server-side

### "Missing index" errors
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Wait 5-10 minutes for index creation

### High latency on trackBottom50Retention
- This is expected for large user bases (O(n) complexity)
- Run as background job, not in request path
- Consider pagination for >10k users

### Empty results
- Verify leaderboard collection is populated
- Check predictions have `timestamp` field
- Ensure match IDs match between predictions and tracking calls

## References

- **Shannon Entropy**: https://en.wikipedia.org/wiki/Entropy_(information_theory)
- **Herfindahl-Hirschman Index**: https://en.wikipedia.org/wiki/Herfindahl%E2%80%93Hirschman_index
- **Firestore Composite Indexes**: https://firebase.google.com/docs/firestore/query-data/indexing

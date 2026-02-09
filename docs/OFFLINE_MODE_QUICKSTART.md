# Offline Mode - Quick Start Guide

## Overview

BetArena's offline mode ensures the app continues working when API-Football is unavailable. This guide shows you how to use it.

## For End Users

### What to Expect

When API-Football is unavailable, you'll see:

1. **Warning Banner** - Yellow/orange/red banner at top showing data status
2. **Toast Notifications** - Pop-up messages about connection status
3. **Cached Data** - App continues showing last known data
4. **Retry Button** - Manual refresh button to attempt reconnection

### Data Freshness Indicators

| Banner Color | Meaning | Action |
|---|---|---|
| 🟢 None | Data is fresh, real-time updates working | None needed |
| 🟡 Yellow | Data slightly delayed (< 5 min old) | Optional: tap refresh |
| 🟠 Orange | Data is stale (5-15 min old) | Recommended: tap refresh |
| 🔴 Red | API offline (> 15 min old) | Cached data only, automatic retry in progress |

### Manual Refresh

Tap the **circular arrow icon** (🔄) in the header to manually sync data.

## For Developers

### Basic Usage

#### 1. Monitor API Health (Lightweight)

```typescript
import { useOfflineMode } from '../hooks/useOfflineMode';

function MyComponent() {
  const { isOnline, lastError } = useOfflineMode();
  
  return (
    <div>
      {!isOnline && (
        <div className="bg-red-900 text-white p-2">
          Offline - showing cached data
        </div>
      )}
      {/* Your component content */}
    </div>
  );
}
```

#### 2. Full Sync Queue Management

```typescript
import { useSyncQueue } from '../hooks/useSyncQueue';

function AdminDashboard() {
  const { 
    jobs, 
    apiHealth, 
    queueJob, 
    processQueue, 
    pendingCount, 
    failedCount 
  } = useSyncQueue();
  
  return (
    <div>
      <p>API Status: {apiHealth.isOnline ? 'Online' : 'Offline'}</p>
      <p>Pending Jobs: {pendingCount}</p>
      <p>Failed Jobs: {failedCount}</p>
      <button onClick={processQueue}>Process Queue</button>
    </div>
  );
}
```

#### 3. Show Notifications

```typescript
import { useSyncQueue } from '../hooks/useSyncQueue';

function HomeView({ showToast }) {
  // Pass notification callback to get real-time alerts
  const { apiHealth } = useSyncQueue(showToast);
  
  // Notifications appear automatically:
  // - "Connexion API perdue - Mode hors ligne activé" (error)
  // - "Connexion API rétablie" (success)
  // - "Ralentissement détecté - Données en cache" (warning)
  
  return <div>...</div>;
}
```

### Queue a Failed Job

Backend functions automatically queue failed jobs. To manually queue:

```typescript
const { queueJob } = useSyncQueue();

// Queue a fixtures sync
await queueJob('FIXTURES', { 
  date: '2025-01-15', 
  leagueIds: [61] 
});

// Queue a live match sync
await queueJob('LIVE_MATCH', { 
  apiId: 12345 
});

// Queue all live matches sync
await queueJob('LIVE_ALL', {});

// Queue standings sync
await queueJob('STANDINGS', { 
  leagueId: 61 
});
```

### Display Staleness Warning

```typescript
import { useMatchFeed } from '../features/match/hooks/useMatchFeed';

function MatchList() {
  const { matches, loading, staleness } = useMatchFeed('2025-01-15');
  
  return (
    <div>
      {staleness.severity !== 'ok' && (
        <div className={`alert alert-${staleness.severity}`}>
          {staleness.message}
          {staleness.minutesSinceUpdate && (
            <span> ({Math.round(staleness.minutesSinceUpdate)} min ago)</span>
          )}
        </div>
      )}
      
      {matches.map(match => <MatchCard key={match.id} match={match} />)}
    </div>
  );
}
```

### Use OfflineBanner Component

```typescript
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { useSyncQueue } from '../hooks/useSyncQueue';
import { useMatchFeed } from '../features/match/hooks/useMatchFeed';

function MyView() {
  const { apiHealth, processQueue } = useSyncQueue();
  const { staleness } = useMatchFeed('2025-01-15');
  
  return (
    <div>
      <OfflineBanner 
        apiHealth={apiHealth}
        staleness={staleness}
        onRetry={processQueue}
      />
      {/* Your content */}
    </div>
  );
}
```

## Testing

### Simulate Offline Mode

1. **In Firestore Console:**
   - Navigate to: `artifacts/botola-v1/admin/api_health/status/current`
   - Set `isOnline: false` and `consecutiveFailures: 5`

2. **In Code:**
   ```typescript
   // Temporarily disable API calls in functions/src/sportsapi.ts
   async function fetchFromApiDirect(endpoint: string) {
     throw new Error('Simulated API failure');
   }
   ```

3. **Verify:**
   - Red banner appears
   - Toast notification "Connexion API perdue"
   - Cached data displays
   - Jobs added to queue

### Test Recovery

1. Restore API configuration or Firestore document
2. Click refresh button or wait for auto-retry
3. Verify:
   - Green "API rétablie" toast
   - Banner disappears
   - Jobs process successfully

## Common Scenarios

### Scenario 1: Pre-match fixtures are stale

**Problem:** Fixtures loaded yesterday, now outdated

**Solution:**
- Tap refresh button in header
- Data syncs from API
- If API fails, job queues for automatic retry

### Scenario 2: Live match not updating

**Problem:** Score stuck at 0-0, but match is 2-1 now

**Solution:**
- Check for orange/red banner (indicates API issue)
- Tap refresh button
- If persistent: API quota exceeded or service down
- Job queued for retry when API recovers

### Scenario 3: Standings not updating after match day

**Problem:** Standings show last week's positions

**Solution:**
- Navigate to standings view
- Tap refresh (if available)
- Backend scheduled sync runs daily at 4 AM
- Manual admin sync: `/?admin=true` → trigger sync

## Monitoring (Admin)

### View Sync Queue

**URL:** `/?admin=true`

**Features:**
- See all pending/failed jobs
- Manual retry buttons
- Clear completed jobs
- API health history

### Key Metrics

- **Pending Jobs:** Jobs waiting to execute
- **Failed Jobs:** Jobs that exceeded max retries (5)
- **Consecutive Failures:** Current API failure streak
- **Estimated Recovery:** When next retry occurs

### Clear Queue

```typescript
const { clearCompleted } = useSyncQueue();
await clearCompleted(); // Removes all COMPLETED jobs
```

## API Reference

### useSyncQueue Hook

```typescript
const {
  jobs,                   // All jobs in queue
  apiHealth,              // Current API health status
  queueJob,               // Add job to queue
  processQueue,           // Process pending jobs now
  retryJob,               // Retry a specific failed job
  clearCompleted,         // Remove completed jobs
  pendingCount,           // Number of pending jobs
  failedCount,            // Number of failed jobs
} = useSyncQueue(notificationCallback?);
```

### useOfflineMode Hook

```typescript
const {
  isOnline,               // Is API responding?
  consecutiveFailures,    // Number of consecutive failures
  lastError,              // Last error message
  lastSuccessfulCall,     // Timestamp of last success
  estimatedRecoveryTime,  // When next retry occurs
} = useOfflineMode();
```

### useMatchFeed Hook

```typescript
const {
  matches,                // Match data
  loading,                // Loading state
  staleness,              // Data freshness info
} = useMatchFeed(dateStr);
```

## Troubleshooting

### Banner always shows "Offline"

**Fix:** Initialize API health document:
```javascript
// In Firestore Console
artifacts/botola-v1/admin/api_health/status/current
{
  "isOnline": true,
  "consecutiveFailures": 0
}
```

### Jobs not processing

**Fix:** Deploy Firestore indexes:
```bash
firebase deploy --only firestore:indexes
```

### Notifications not showing

**Fix:** Pass callback to useSyncQueue:
```typescript
const { apiHealth } = useSyncQueue(showToast);
```

## Related Documentation

- **Full Documentation:** [OFFLINE_MODE.md](OFFLINE_MODE.md)
- **API Monitoring:** [API_MONITORING.md](API_MONITORING.md)
- **Feature Flags:** [FEATURE_FLAGS.md](FEATURE_FLAGS.md)

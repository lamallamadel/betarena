# Offline Mode & Graceful Degradation

## Overview

BetArena implements a comprehensive offline mode system that ensures the app remains functional when the API-Football service is unavailable or experiencing issues. The system includes:

- **Cached data with staleness warnings**
- **Failed API sync job queue with automatic retry**
- **User-facing notifications** when live data is delayed
- **API health monitoring** with exponential backoff
- **Graceful degradation** from real-time to cached data

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  HomeView    │───▶│ useSyncQueue │───▶│OfflineBanner │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                    │               │
│         │                   │                    │               │
│         ▼                   ▼                    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │useMatchFeed  │    │  API Health  │    │ Toast Notify │      │
│  │(staleness)   │    │  Monitoring  │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ Firebase Realtime Listeners
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                          Firestore                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  artifacts/botola-v1/                                            │
│    ├── admin/                                                    │
│    │   ├── api_health/status/current                           │
│    │   └── sync_queue/jobs/{jobId}                             │
│    └── public/data/matches/{matchId}                            │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ Cloud Functions Triggers
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                      Cloud Functions                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Request Wrapper (fetchFromApiDirect)                  │  │
│  │  ├─ Track API health                                     │  │
│  │  ├─ Log all calls                                        │  │
│  │  └─ Queue failed jobs on error                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │syncFixtures  │  │syncLiveMatch │  │ syncAllLive  │          │
│  │   + retry    │  │   + retry    │  │   + retry    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ HTTP Requests + Redis Cache
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                       API-Football                                │
│                    (v3.football.api-sports.io)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structures

### API Health Status

**Path:** `artifacts/botola-v1/admin/api_health/status/current`

```typescript
interface ApiHealthStatus {
  isOnline: boolean;                  // True if API is responding
  lastSuccessfulCall?: Timestamp;     // Last successful API call
  consecutiveFailures: number;        // Number of failures in a row
  lastError?: string;                 // Last error message
  estimatedRecoveryTime?: number;     // Timestamp when next retry will occur
  lastFailure?: Timestamp;            // When last failure occurred
}
```

**Health Status Logic:**
- `consecutiveFailures < 3`: `isOnline = true`
- `consecutiveFailures >= 3`: `isOnline = false` (offline mode)

### Sync Job Queue

**Path:** `artifacts/botola-v1/admin/sync_queue/jobs/{jobId}`

```typescript
interface SyncJob {
  id: string;                         // Unique job ID
  type: SyncJobType;                  // FIXTURES | LIVE_MATCH | LIVE_ALL | STANDINGS | EVENTS | LINEUPS | ODDS
  status: SyncJobStatus;              // PENDING | RETRYING | FAILED | COMPLETED
  params: Record<string, any>;        // Job-specific parameters
  attempts: number;                   // Current retry attempt count
  maxAttempts: number;                // Max retries (default: 5)
  lastAttempt?: number;               // Timestamp of last retry
  nextRetry?: number;                 // Timestamp when next retry should occur
  error?: string;                     // Last error message
  createdAt: number;                  // Job creation timestamp
  updatedAt: number;                  // Last update timestamp
}
```

**Retry Delays (Exponential Backoff):**
- Attempt 1: 30 seconds
- Attempt 2: 1 minute
- Attempt 3: 5 minutes
- Attempt 4+: 15 minutes

### Data Staleness

**Calculated in:** `src/features/match/hooks/useMatchFeed.ts`

```typescript
interface DataStaleness {
  isFresh: boolean;                   // Is data considered fresh?
  lastUpdate?: number;                // Timestamp of last update
  minutesSinceUpdate?: number;        // Minutes since last update
  message?: string;                   // User-facing message
  severity: 'ok' | 'warning' | 'stale' | 'critical';
}
```

**Staleness Thresholds:**

For **live matches**:
- **< 3 min**: `ok` - Fresh data
- **3-5 min**: `warning` - "Données en direct légèrement retardées"
- **5-15 min**: `stale` - "Données en direct retardées"
- **> 15 min**: `critical` - "Connexion API perdue - Affichage des dernières données"

For **pre-match/finished matches**:
- **< 60 min**: `ok` - Fresh data
- **60-180 min**: `warning` - "Données partiellement à jour"
- **> 180 min**: `stale` - "Données potentiellement obsolètes"

## Frontend Components

### 1. OfflineBanner Component

**Path:** `src/components/ui/OfflineBanner.tsx`

Displays a banner at the top of the screen when:
- API is offline
- Data is stale
- Live data is delayed

**Features:**
- Color-coded severity levels (yellow, orange, red)
- Time since last update
- Estimated recovery time
- Manual retry button

### 2. ToastNotification Component

**Path:** `src/components/ui/ToastNotification.tsx`

Enhanced to support multiple notification types:
- `success` - Green, CheckCircle icon
- `warning` - Yellow, AlertTriangle icon
- `error` - Red, XCircle icon
- `info` - Blue, Info icon

### 3. useSyncQueue Hook

**Path:** `src/hooks/useSyncQueue.ts`

**Purpose:** Manages sync job queue and API health monitoring

**Features:**
- Real-time job queue monitoring
- API health status tracking with notifications
- Job creation and retry management
- Automatic queue processing every 30 seconds

**Key Functions:**
```typescript
queueJob(type: SyncJobType, params: Record<string, any>): Promise<string>
processQueue(): Promise<void>
retryJob(jobId: string): Promise<void>
clearCompleted(): Promise<void>
```

**Notification Callbacks:**
```typescript
// API went offline
"Connexion API perdue - Mode hors ligne activé" (error)

// API recovered
"Connexion API rétablie" (success)

// First failure detected
"Ralentissement détecté - Données en cache" (warning)

// Second failure
"Problème de connexion persistant" (warning)
```

### 4. useMatchFeed Hook

**Path:** `src/features/match/hooks/useMatchFeed.ts`

**Purpose:** Fetches match data and calculates staleness

**Returns:**
```typescript
{
  matches: Match[];
  loading: boolean;
  staleness: DataStaleness;
}
```

## Backend Implementation

### 1. API Health Tracking

**Function:** `updateApiHealth(success: boolean, error?: string)`

**Location:** `functions/src/sportsapi.ts`

**Behavior:**
- On success: Resets consecutive failures to 0
- On failure: Increments consecutive failures, calculates next retry time
- Updates `api_health/status/current` document

### 2. Job Queue System

**Function:** `queueSyncJob(type, params)`

**Location:** `functions/src/sportsapi.ts`

**Behavior:**
- Creates new job document in Firestore
- Sets initial retry delay (30 seconds)
- Logs job creation

### 3. Wrapped Sync Functions

All sync functions now automatically queue failed jobs:

#### syncFixtures
```typescript
try {
  // Sync logic
} catch (error) {
  await queueSyncJob('FIXTURES', { date, leagueIds: [leagueId] });
}
```

#### syncLiveMatch
```typescript
try {
  // Sync logic
} catch (error) {
  await queueSyncJob('LIVE_MATCH', { apiId });
}
```

#### syncAllLive
```typescript
try {
  // Sync all live matches
} catch (error) {
  await queueSyncJob('LIVE_ALL', {});
}
```

#### syncStandings
```typescript
try {
  // Sync standings
} catch (error) {
  await queueSyncJob('STANDINGS', { leagueId });
}
```

### 4. Scheduled Sync

**Function:** `scheduledFixtureSync`

**Schedule:** Daily at 4 AM (Africa/Casablanca)

**Behavior:**
- Syncs today + tomorrow fixtures
- Syncs all league standings
- Automatically queues failed syncs for retry

## User Experience

### Normal Operation (API Online)

1. User opens app
2. Data loads from Firestore (real-time listeners)
3. Background: Sync functions update data every 60 seconds for live matches
4. **No banners or warnings displayed**

### API Slowdown (1-2 Failures)

1. API call fails once or twice
2. `consecutiveFailures` increments to 1-2
3. Toast notification: "Ralentissement détecté - Données en cache" (warning)
4. Data continues to display from cache
5. **Yellow warning banner** appears at top: "Données partiellement à jour"
6. Failed jobs queued for retry in 30s-1m

### API Offline (3+ Failures)

1. API fails 3+ times consecutively
2. `isOnline` = `false`
3. Toast notification: "Connexion API perdue - Mode hors ligne activé" (error)
4. Data displays from cache with staleness timestamp
5. **Red critical banner** appears: "Connexion API perdue - Affichage des dernières données"
6. Manual retry button available
7. Jobs queued for retry in 5-15 minutes

### Recovery

1. First successful API call after outage
2. `isOnline` = `true`, `consecutiveFailures` = 0
3. Toast notification: "Connexion API rétablie" (success)
4. Banner disappears
5. Pending jobs process immediately
6. Live data resumes normal updates

## Manual Sync

Users can manually trigger sync via the **Refresh** button in HomeView:

```typescript
// In HomeView.tsx
<button onClick={async () => {
  setSyncing(true);
  try {
    const syncFixturesFn = httpsCallable(functions, 'syncFixtures');
    await syncFixturesFn({ date: dateStr });
  } catch (e) {
    // Automatically queued for retry by backend
    await queueJob('FIXTURES', { date: dateStr });
  } finally {
    setSyncing(false);
  }
}}>
  <RefreshCcw />
</button>
```

## Admin Dashboard

View sync queue and API health in admin dashboard:

**URL:** `/?admin=true`

**Features:**
- Real-time job queue status
- Pending/failed job counts
- Manual job retry
- Clear completed jobs
- API health history

## Testing Offline Mode

### Simulate API Failure

1. **In Cloud Functions:**
   - Comment out API key validation to force failures
   - Or set `SPORTS_API_KEY` to invalid value

2. **In Firestore:**
   - Manually update `api_health/status/current`:
     ```json
     {
       "isOnline": false,
       "consecutiveFailures": 5,
       "lastError": "Simulated failure"
     }
     ```

3. **Verify:**
   - Red banner appears
   - Toast notification shown
   - Cached data displayed
   - Jobs queued

### Test Recovery

1. **Restore API Key**
2. **Trigger Manual Sync** via refresh button
3. **Verify:**
   - Green "API rétablie" toast
   - Banner disappears
   - Jobs process
   - Real-time updates resume

## Performance Considerations

### Firestore Reads

- API health: **1 listener per user session** (real-time)
- Sync queue: **1 listener per admin session** (real-time)
- Match data: **1 listener per date** (real-time)

### Background Processing

- Queue processor: **Every 30 seconds** (frontend)
- Scheduled sync: **Once daily at 4 AM** (backend)
- Live match sync: **Every 60-120 seconds** (backend, on-demand)

### Quota Management

- Failed calls **do not count** toward API quota (no HTTP request made on retry)
- Successful cache hits **do not count** toward API quota
- Job retries use **exponential backoff** to avoid API overload

## Security

### Firestore Rules

```javascript
// API Health - Read for all authenticated, write for system only
match /artifacts/{appId}/admin/api_health/{document=**} {
  allow read: if request.auth != null;
  allow write: if false; // Only Cloud Functions
}

// Sync Queue - Read/write for authenticated users
match /artifacts/{appId}/admin/sync_queue/{document=**} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null;
}
```

## Future Enhancements

### Planned Features

1. **Smart retry scheduling**
   - Skip retries during known maintenance windows
   - Prioritize live match syncs over pre-match

2. **User preferences**
   - Toggle offline mode notifications
   - Adjust staleness thresholds

3. **Advanced caching**
   - Service Worker for offline PWA support
   - IndexedDB for client-side caching

4. **Predictive sync**
   - Pre-fetch likely matches user will view
   - Background sync when app is idle

5. **Network quality detection**
   - Adjust sync frequency based on connection speed
   - Warn users on slow connections

## Troubleshooting

### Issue: Banner always shows "Offline"

**Cause:** API health document not initialized

**Solution:**
```typescript
// Initialize manually in Firestore
artifacts/botola-v1/admin/api_health/status/current
{
  "isOnline": true,
  "consecutiveFailures": 0
}
```

### Issue: Jobs not processing

**Cause:** Missing Firestore indexes

**Solution:**
```bash
firebase deploy --only firestore:indexes
```

### Issue: Toast notifications not showing

**Cause:** Callback not passed to useSyncQueue

**Solution:**
```typescript
// In HomeView.tsx
const { apiHealth, queueJob } = useSyncQueue(showToast);
```

### Issue: Stale data not detected

**Cause:** `updated_at` field missing on match documents

**Solution:**
- Ensure all sync functions set `updated_at: FieldValue.serverTimestamp()`
- Re-sync matches to populate field

## Monitoring

### Key Metrics to Track

1. **API Health:**
   - Success rate (last 24h)
   - Average consecutive failures
   - Recovery time

2. **Sync Queue:**
   - Pending job count
   - Failed job count
   - Average retry count per job
   - Job completion rate

3. **User Experience:**
   - % of users seeing offline banner
   - Average data staleness
   - Manual refresh frequency

### Logging

All offline mode events are logged:

```typescript
// Backend (Cloud Functions)
logger.info("Sync job queued", { type, jobId });
logger.error("API health degraded", { consecutiveFailures });

// Frontend (Console)
console.log("API went offline", apiHealth);
console.log("Job processing started", { jobId });
```

## References

- **API-Football Docs:** https://www.api-football.com/documentation-v3
- **Firebase Firestore:** https://firebase.google.com/docs/firestore
- **Redis Caching:** `functions/src/cache.ts`
- **Sync Queue Hook:** `src/hooks/useSyncQueue.ts`
- **API Health Tracking:** `functions/src/sportsapi.ts`

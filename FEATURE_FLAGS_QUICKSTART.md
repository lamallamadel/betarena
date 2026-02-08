# Feature Flags - Quick Start Guide

## Setup (First Time Only)

### 1. Initialize Feature Flags in Firestore

Call the Cloud Function to create default configurations:

```bash
# After deploying functions
curl -X POST https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/initializeFeatureFlags
```

Or manually create the documents in Firestore Console:
- Path: `artifacts/botola-v1/config/feature_flags/environments/{dev|staging|prod}`

## Admin Access

1. Navigate to: `http://localhost:5173/?admin=true`
2. Click on the **"Feature Flags"** tab
3. Select environment: **Dev**, **Staging**, or **Prod**

## Common Use Cases

### Enable Debug Mode

**Admin UI:**
1. Go to Feature Flags tab
2. Toggle "Mode Debug" switch
3. Click "Enregistrer"

**Code:**
```typescript
const { isDebugMode } = useFeatureFlag();

if (isDebugMode) {
  console.log('Debug info:', someData);
}
```

### Toggle Experimental Feature

**Admin UI:**
1. Find feature in "Fonctionnalités Expérimentales"
2. Toggle switch (e.g., "marketplace")
3. Click "Enregistrer"

**Code:**
```typescript
const { isEnabled } = useFeatureFlag();

if (isEnabled('marketplace')) {
  return <MarketplaceView />;
}
```

### Adjust Polling Intervals

**Admin UI:**
1. Navigate to "Intervalles de Synchronisation"
2. Modify input values (e.g., "Polling Matchs" to 30 seconds)
3. Click "Enregistrer"

**Code:**
```typescript
const { getPollingInterval } = useFeatureFlag();

useEffect(() => {
  const interval = setInterval(() => {
    fetchMatches();
  }, getPollingInterval('match'));

  return () => clearInterval(interval);
}, [getPollingInterval]);
```

### Enable Maintenance Mode

**Admin UI:**
1. Navigate to "Mode Maintenance"
2. Toggle "Activer la maintenance"
3. Add custom message
4. Add admin UIDs to allowlist (comma-separated)
5. Click "Enregistrer"

**Effect:**
- All users see maintenance screen
- Users in allowlist can access normally
- Admin dashboard (`?admin=true`) always accessible

### Control API Settings

**Admin UI:**
1. Navigate to "Paramètres API"
2. Toggle "Activer les appels API" (disable to use cache only)
3. Toggle "Activer le cache"
4. Adjust "Limite quotidienne d'appels" and "TTL du cache"
5. Click "Enregistrer"

**Code:**
```typescript
const { apiSettings } = useFeatureFlag();

if (!apiSettings.enable_api_calls) {
  // Use cached data only
  return getCachedData();
}

// Proceed with API call
```

## Environment Detection

The app automatically detects the environment:

- **localhost** / **127.0.0.1** → `dev`
- **staging.yourdomain.com** → `staging`
- **yourdomain.com** → `prod`

Each environment has independent flag configurations.

## Best Practices

1. **Test in Dev First**: Always enable new features in `dev` environment first
2. **Progressive Rollout**: Dev → Staging → Prod
3. **Monitoring**: Check "Historique des Modifications" to track changes
4. **Rollback**: Use "Réinitialiser" button to restore default values
5. **API Limits**: Keep `max_daily_calls` ≤ 100 for free tier

## Troubleshooting

**Changes not applying?**
- Ensure you clicked "Enregistrer"
- Refresh the page (flags update in real-time but may need refresh)
- Check browser console for errors

**Maintenance mode not working?**
- Verify `maintenance.enabled` is true
- Check user UID is NOT in `allowed_users` list
- Admins using `?admin=true` bypass maintenance

**Feature still hidden?**
- Verify correct environment is selected
- Check feature key spelling in code
- Confirm flag is saved in Firestore

## Learn More

- **Full Documentation**: [docs/FEATURE_FLAGS.md](docs/FEATURE_FLAGS.md)
- **Codebase Guide**: [CLAUDE.md](CLAUDE.md)
- **API Monitoring**: [docs/API_MONITORING.md](docs/API_MONITORING.md)

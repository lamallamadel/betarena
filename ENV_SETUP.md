# Environment Variables Setup Guide

## Overview

BetArena uses environment variables to manage sensitive configuration like Firebase credentials and third-party API keys. This guide explains how to set up your environment for local development and production deployment.

## Quick Start

```bash
# 1. Frontend environment
cp .env.example .env
# Edit .env with your Firebase credentials

# 2. Cloud Functions environment
cp functions/.env.example functions/.env
# Edit functions/.env with your API-Football key

# 3. Validate environment variables (optional)
npm run validate:env

# 4. Run the app
npm run dev

# 5. Run Cloud Functions locally
cd functions && npm run serve
```

## Frontend Configuration

### Required Variables

All variables are prefixed with `VITE_` (Vite requirement for client-side access):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `your-project` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID | `G-XXXXXXXXXX` |

### How to Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ > Project settings
4. Scroll to "Your apps" section
5. Select your web app (or create one)
6. Copy the config values into your `.env` file

### Runtime Validation

The application validates all Firebase environment variables at startup in `src/config/firebase.ts`. If any variable is missing, you'll see:

```
Error: Missing required environment variable: VITE_FIREBASE_API_KEY.
Please ensure your .env file is configured correctly.
See .env.example for required variables.
```

**This validation prevents runtime failures** with unclear error messages.

## Cloud Functions Configuration

### Required Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `SPORTS_API_KEY` | API-Football.com API key | https://dashboard.api-football.com/ |

### How to Get API-Football Key

1. Sign up at https://dashboard.api-football.com/register
2. Free plan: 100 requests/day (sufficient for testing)
3. Copy your API key from the dashboard
4. Add to `functions/.env`:
   ```
   SPORTS_API_KEY=your_key_here
   ```

### Runtime Validation

The API key is validated on first use in `functions/src/sportsapi.ts`. If missing, you'll see:

```
Error: Missing required environment variable: SPORTS_API_KEY.
For local development, set it in functions/.env file.
For production, use: firebase functions:config:set sports.api_key=YOUR_KEY
or Firebase Secrets Manager: firebase functions:secrets:set SPORTS_API_KEY
```

## Local Development

### Frontend

```bash
# Vite automatically loads .env files
npm run dev
```

Vite loads environment variables in this order:
1. `.env` (committed template - use .env.example)
2. `.env.local` (local overrides, git-ignored)
3. `.env.development` (development mode)
4. `.env.development.local` (local development overrides)

### Cloud Functions

```bash
cd functions
npm run serve
```

The Firebase emulator automatically loads `functions/.env` when running locally.

## Production Deployment

### Frontend

Vite injects environment variables at **build time**:

```bash
npm run build
```

For production, you can:
1. Set production values in `.env.production` (git-ignored)
2. Or use CI/CD environment variables (recommended for secrets)

### Cloud Functions

**Option 1: Firebase Secrets Manager (Recommended)**

```bash
# Set the secret
firebase functions:secrets:set SPORTS_API_KEY
# You'll be prompted to enter the value

# Deploy with secrets
firebase deploy --only functions
```

Access in code:
```typescript
import { defineSecret } from 'firebase-functions/params';

const sportsApiKey = defineSecret('SPORTS_API_KEY');

export const myFunction = onRequest(
  { secrets: [sportsApiKey] },
  (req, res) => {
    const key = sportsApiKey.value();
    // Use key...
  }
);
```

**Option 2: Firebase Config (Legacy)**

```bash
# Set config
firebase functions:config:set sports.api_key=YOUR_KEY

# View config
firebase functions:config:get

# Deploy
firebase deploy --only functions
```

Access in code:
```typescript
import * as functions from 'firebase-functions';

const apiKey = functions.config().sports.api_key;
```

**Option 3: Environment Variables (Current Implementation)**

The current implementation uses `process.env.SPORTS_API_KEY`. For production:

```bash
# Set via Firebase CLI before deploying
export SPORTS_API_KEY=your_key
firebase deploy --only functions
```

Or configure in your CI/CD pipeline (GitHub Actions, etc.).

## Security Best Practices

### ✅ Do

- ✅ Keep `.env` files in `.gitignore`
- ✅ Use `.env.example` as a template (committed)
- ✅ Use different keys for development and production
- ✅ Rotate API keys regularly
- ✅ Use Firebase Secrets Manager for production
- ✅ Set restrictive Firestore security rules

### ❌ Don't

- ❌ Commit `.env` files with real credentials
- ❌ Share API keys in code reviews or Slack
- ❌ Use production credentials in development
- ❌ Hardcode API keys in source code
- ❌ Log sensitive environment variables

## Validation Script

A validation script is included to check your environment variables before building or deploying:

```bash
# Validate all environment variables
npm run validate:env

# Validate frontend only
npm run validate:env:frontend

# Validate functions only
npm run validate:env:functions
cd functions && npm run validate:env
```

The validation script:
- ✅ Checks if .env files exist
- ✅ Verifies all required variables are present
- ✅ Detects placeholder values that need replacement
- ✅ Provides helpful error messages with setup instructions

**Auto-validation**: The build script (`npm run build`) and functions deploy script (`cd functions && npm run deploy`) automatically run validation before building/deploying.

## Troubleshooting

### "Missing required environment variable" Error

**Cause**: Environment variable not set or `.env` file not loaded.

**Solution**:
1. Verify `.env` file exists: `ls -la .env`
2. Check file contents: `cat .env` (be careful in shared terminals!)
3. Restart dev server: `npm run dev`
4. For functions: `cd functions && npm run serve`

### Variables Not Loading in Frontend

**Cause**: Variable name doesn't start with `VITE_`.

**Solution**: Rename variable to include `VITE_` prefix in both `.env` and code.

### Functions Deployment Fails with API Error

**Cause**: `SPORTS_API_KEY` not set in production environment.

**Solution**: Use Firebase Secrets Manager:
```bash
firebase functions:secrets:set SPORTS_API_KEY
firebase deploy --only functions
```

### Vite Build Shows `undefined` for Environment Variables

**Cause**: Variables are evaluated at build time, not runtime.

**Solution**: Ensure variables are set in your build environment (CI/CD secrets, `.env.production`, etc.)

## CI/CD Setup

### GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Frontend build with secrets
      - name: Build frontend
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          # ... other vars
        run: npm run build
      
      # Functions deployment
      - name: Deploy functions
        env:
          SPORTS_API_KEY: ${{ secrets.SPORTS_API_KEY }}
        run: |
          cd functions
          npm run deploy
```

Add secrets in: GitHub repo > Settings > Secrets and variables > Actions

## Summary

| Component | Config File | Variables | Validation |
|-----------|------------|-----------|------------|
| Frontend | `.env` | 7 Firebase vars (VITE_*) | `src/config/firebase.ts` |
| Functions | `functions/.env` | 1 API key | `functions/src/sportsapi.ts` |
| Production | Firebase Secrets | Same as above | Runtime checks |

All environment variables have **runtime validation** that provides clear error messages with setup instructions. This ensures you never deploy with missing configuration.

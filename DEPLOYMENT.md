# BetArena Deployment Guide

## Environment Variables Setup

This project uses environment variables to securely manage API keys and configuration. Follow the steps below for local development and production deployment.

---

## Frontend Setup

### Local Development

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your Firebase configuration:**
   
   Get these values from [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your apps

   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Production Build

The environment variables are injected at build time by Vite. Ensure your `.env` file is properly configured before building:

```bash
npm run build
```

### CI/CD Deployment (GitHub Actions, etc.)

Set environment variables in your CI/CD platform's secrets management:

**GitHub Actions Example:**

```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIREBASE_MEASUREMENT_ID: ${{ secrets.VITE_FIREBASE_MEASUREMENT_ID }}
        run: npm run build
      
      - name: Deploy to Firebase Hosting
        run: npx firebase deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## Cloud Functions Setup

### Local Development

1. **Navigate to functions directory:**
   ```bash
   cd functions
   ```

2. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `functions/.env` with your API keys:**
   ```env
   SPORTS_API_KEY=your_api_football_key_here
   ```
   
   Get your API key from [API-Football Dashboard](https://dashboard.api-football.com/)

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Run Firebase emulators:**
   ```bash
   npm run serve
   ```

### Production Deployment

You have three options for managing environment variables in production:

#### Option 1: Firebase Secrets Manager (Recommended)

Best for sensitive data like API keys. Secrets are encrypted and securely managed by Google Secret Manager.

```bash
# Set the secret
firebase functions:secrets:set SPORTS_API_KEY
# Enter your API key when prompted

# Deploy functions
firebase deploy --only functions
```

**View secrets:**
```bash
firebase functions:secrets:access SPORTS_API_KEY
```

**Update a secret:**
```bash
firebase functions:secrets:set SPORTS_API_KEY
```

#### Option 2: Firebase Functions Config (Legacy)

Simpler but less secure. Config values are stored in Firebase's runtime config.

```bash
# Set config value
firebase functions:config:set sports.api_key="YOUR_API_KEY"

# Deploy functions
firebase deploy --only functions
```

**View config:**
```bash
firebase functions:config:get
```

**In your code, access via:**
```typescript
const apiKey = functions.config().sports.api_key;
```

#### Option 3: CI/CD Environment Variables

For automated deployments via GitHub Actions or similar:

**GitHub Actions Example:**

```yaml
name: Deploy Functions
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: |
          cd functions
          npm ci
      
      - name: Create .env file
        run: |
          cd functions
          echo "SPORTS_API_KEY=${{ secrets.SPORTS_API_KEY }}" > .env
      
      - name: Deploy to Firebase
        run: firebase deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

### Deployment Commands

```bash
# Deploy all functions
cd functions
npm run deploy

# Deploy specific function
firebase deploy --only functions:syncFixtures

# View logs
npm run logs

# Or view specific function logs
firebase functions:log --only syncFixtures
```

---

## Environment Variables Reference

### Frontend Variables

All frontend environment variables **must** be prefixed with `VITE_`:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | ✅ | `AIzaSyB3h...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | ✅ | `crossteamz.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | ✅ | `crossteamz` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | ✅ | `crossteamz.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | ✅ | `933700937863` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | ✅ | `1:933700937863:web:a8c0...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID | ✅ | `G-Z1F0BJSWTM` |

### Backend Variables (Cloud Functions)

| Variable | Description | Required | Where to Get |
|----------|-------------|----------|--------------|
| `SPORTS_API_KEY` | API-Football API key | ✅ | [api-football.com](https://dashboard.api-football.com/) |

---

## Security Best Practices

### ⚠️ Critical Security Rules

1. **NEVER commit `.env` files to version control**
   - `.env` files are already in `.gitignore`
   - Always use `.env.example` as templates

2. **Use environment-specific `.env` files**
   - `.env.local` for local overrides
   - `.env.production` for production-specific values
   - `.env.development` for development-specific values

3. **Rotate API keys regularly**
   - Schedule periodic key rotation
   - Update keys in both Firebase and CI/CD platforms

4. **Restrict Firebase API keys**
   - Use [Firebase App Check](https://firebase.google.com/docs/app-check)
   - Set up API restrictions in Google Cloud Console

5. **Monitor API usage**
   - Check Firebase Console for unusual activity
   - Monitor API-Football quota usage
   - Set up alerts for quota limits

6. **Use Firebase Secrets Manager for production**
   - More secure than environment variables
   - Automatically encrypted at rest
   - Audit logging available

### Checking for Exposed Secrets

Before committing, verify no secrets are exposed:

```bash
# Check git status
git status

# Ensure .env is not staged
git diff --cached

# Search for potential secrets in code
grep -r "AIzaSy" src/
grep -r "FIREBASE_API_KEY" src/
```

---

## Troubleshooting

### Frontend Issues

**Error: `Missing required environment variable: VITE_FIREBASE_API_KEY`**

- Ensure `.env` file exists in project root
- Verify all `VITE_*` variables are set
- Restart dev server: `Ctrl+C` then `npm run dev`

**Build fails with undefined environment variables**

- Check `vite.config.ts` has all variables in `define` block
- Ensure `.env` file is in the same directory as `vite.config.ts`

### Cloud Functions Issues

**Error: `Missing required environment variable: SPORTS_API_KEY`**

- For local: Ensure `functions/.env` exists with `SPORTS_API_KEY`
- For production: Set secret via `firebase functions:secrets:set SPORTS_API_KEY`

**Functions deploy succeeds but API calls fail**

- Verify secret is set: `firebase functions:secrets:access SPORTS_API_KEY`
- Check Cloud Function logs: `firebase functions:log`
- Verify API key is valid on API-Football dashboard

**Emulator can't read .env file**

- Ensure `.env` is in `functions/` directory (not project root)
- Check file encoding (should be UTF-8)
- Try absolute path in error message

---

## Migration from Hardcoded Keys

If migrating from hardcoded keys:

1. **Backup current keys:**
   ```bash
   # Extract keys from firebase.ts
   grep "apiKey" src/config/firebase.ts
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Add your keys to .env
   ```

3. **Verify application starts:**
   ```bash
   npm run dev
   ```

4. **Test all Firebase operations:**
   - User authentication
   - Firestore reads/writes
   - Analytics events

5. **Deploy and test production:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Functions Environment Configuration](https://firebase.google.com/docs/functions/config-env)
- [Firebase Secrets Manager](https://firebase.google.com/docs/functions/secrets)
- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [GitHub Actions Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## Quick Reference Commands

```bash
# Frontend
cp .env.example .env                    # Setup environment
npm run dev                              # Start dev server
npm run build                            # Build for production

# Cloud Functions
cd functions
cp .env.example .env                     # Setup environment
npm run serve                            # Run emulator
npm run deploy                           # Deploy to Firebase
firebase functions:secrets:set KEY       # Set production secret
firebase functions:log                   # View logs
```

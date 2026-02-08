# Environment Variables Migration Summary

## Overview

This document summarizes the complete migration of hardcoded API keys to environment variables with runtime validation.

## What Was Done

### ✅ Already Implemented (Pre-existing)

1. **Frontend environment variables** (src/config/firebase.ts)
   - All Firebase credentials use `import.meta.env.VITE_*` variables
   - Runtime validation function that throws errors on missing variables
   - Descriptive error messages with setup instructions

2. **Functions environment variables** (functions/src/sportsapi.ts)
   - SPORTS_API_KEY uses `process.env.SPORTS_API_KEY`
   - Runtime validation function that throws errors on missing key
   - Clear error messages for both local and production environments

3. **Vite configuration** (vite.config.ts)
   - Loads environment variables with `loadEnv()`
   - Injects variables into build via `define` config

4. **.env files**
   - Root `.env` and `functions/.env` exist with actual values
   - `.env.example` templates in both locations

### ✨ New Implementations

1. **Enhanced .env.example files**
   - Added security warnings about not committing real credentials
   - Added detailed comments about where to get values
   - Updated functions/.env.example with API sign-up link and free tier info

2. **Improved .gitignore files**
   - Root `.gitignore`: Added more .env variants (.env.production, .env.development, etc.)
   - Root `.gitignore`: Added Firebase and OS files
   - `functions/.gitignore`: Added more .env variants

3. **Comprehensive documentation**
   - **ENV_SETUP.md**: Complete guide with quick start, troubleshooting, CI/CD examples
   - **SECURITY_NOTICE.md**: Security alert about tracked functions/.env file
   - **ENVIRONMENT_MIGRATION.md**: This summary document
   - Updated **README.md**: Links to ENV_SETUP.md, mentions runtime validation
   - Updated **CLAUDE.md**: New environment variables section in Known Issues
   - Updated **functions/README.md**: Runtime validation details and troubleshooting

4. **Validation script** (scripts/validate-env.js)
   - Node.js script to validate environment variables pre-deployment
   - Checks if .env files exist
   - Verifies all required variables are present
   - Detects placeholder values (your_api_key_here, etc.)
   - Colorful terminal output with clear error messages
   - Can validate frontend, functions, or both

5. **NPM scripts integration**
   - Root package.json:
     - `npm run validate:env` - Validate all
     - `npm run validate:env:frontend` - Frontend only
     - `npm run validate:env:functions` - Functions only
     - `npm run build` - Now auto-validates before building
   - functions/package.json:
     - `npm run validate:env` - Validate functions env
     - `npm run deploy` - Now auto-validates before deploying

## File Changes Summary

### Created Files
- `ENV_SETUP.md` - Comprehensive setup guide (286 lines)
- `SECURITY_NOTICE.md` - Security notice about tracked env file (79 lines)
- `ENVIRONMENT_MIGRATION.md` - This file
- `scripts/validate-env.js` - Validation script (191 lines)

### Modified Files
- `.env.example` - Added warnings and better comments
- `.gitignore` - Added more .env variants and Firebase/OS files
- `functions/.env.example` - Added warnings and API signup info
- `functions/.gitignore` - Added more .env variants
- `README.md` - Added ENV_SETUP.md link and validation mentions
- `CLAUDE.md` - Added environment variables section, marked issue as resolved
- `functions/README.md` - Added runtime validation details and troubleshooting
- `package.json` - Added validation scripts
- `functions/package.json` - Added validation scripts

### Unchanged Files (Already Correct)
- `src/config/firebase.ts` - Runtime validation already present
- `functions/src/sportsapi.ts` - Runtime validation already present
- `vite.config.ts` - Environment loading already correct

## Security Status

### ⚠️ Action Required

The `functions/.env` file is currently tracked in git and contains a real API key. To secure the repository:

```bash
# Remove from git (keeps local copy)
git rm --cached functions/.env
git commit -m "Remove functions/.env from version control"

# Rotate the API key at https://dashboard.api-football.com/
# Update local functions/.env with new key
# Update production: firebase functions:secrets:set SPORTS_API_KEY
```

See [SECURITY_NOTICE.md](./SECURITY_NOTICE.md) for detailed steps.

## Environment Variables Reference

### Frontend (.env)
```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

**Runtime Validation**: `src/config/firebase.ts` (line 8-17)

### Functions (functions/.env)
```bash
SPORTS_API_KEY=
```

**Runtime Validation**: `functions/src/sportsapi.ts` (line 14-25)

## How Runtime Validation Works

### Frontend Validation

When the app starts, `src/config/firebase.ts` is imported by `main.tsx`. The file immediately:
1. Calls `validateEnvVar()` for each Firebase config variable
2. If any variable is undefined, throws an Error with:
   - Variable name
   - Instructions to check .env file
   - Reference to .env.example

This happens **before** Firebase initialization, preventing cryptic Firebase errors.

### Functions Validation

When `functions/src/sportsapi.ts` is loaded (on first API call), it:
1. Calls `validateApiKey()` to check `process.env.SPORTS_API_KEY`
2. If missing, throws an Error with:
   - Instructions for local development (.env file)
   - Instructions for production (Firebase config or Secrets Manager)

This happens **before** any API requests, preventing failed HTTP requests.

## Validation Script Usage

```bash
# Before building
npm run build              # Auto-validates, then builds

# Before deploying functions
cd functions
npm run deploy             # Auto-validates, then deploys

# Manual validation
npm run validate:env       # Validate everything
npm run validate:env:frontend
npm run validate:env:functions
```

## CI/CD Integration

For GitHub Actions or other CI/CD:

```yaml
- name: Build frontend
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    # ... other vars
  run: npm run build  # Auto-validates before building

- name: Deploy functions
  env:
    SPORTS_API_KEY: ${{ secrets.SPORTS_API_KEY }}
  run: |
    cd functions
    npm run deploy  # Auto-validates before deploying
```

## Testing the Implementation

1. **Test frontend validation**:
   ```bash
   # Rename .env temporarily
   mv .env .env.backup
   
   # Try to run - should fail with clear error
   npm run dev
   
   # Restore
   mv .env.backup .env
   ```

2. **Test functions validation**:
   ```bash
   # Backup functions/.env
   mv functions/.env functions/.env.backup
   
   # Try to deploy - should fail with clear error
   cd functions && npm run deploy
   
   # Restore
   mv functions/.env.backup functions/.env
   ```

3. **Test validation script**:
   ```bash
   # Should detect missing files
   npm run validate:env
   ```

## Documentation Hierarchy

```
README.md (overview)
  ├── ENV_SETUP.md (complete setup guide) ← START HERE
  │   ├── Quick start
  │   ├── Frontend setup
  │   ├── Functions setup
  │   ├── Production deployment
  │   ├── Validation script
  │   ├── Troubleshooting
  │   └── CI/CD examples
  │
  ├── SECURITY_NOTICE.md (action items)
  │
  ├── CLAUDE.md (codebase guide)
  │   └── Environment Variables section
  │
  └── functions/README.md (functions-specific)
      └── Environment Variables section
```

## Success Criteria ✅

- [x] No hardcoded API keys in source code
- [x] All environment variables use .env files
- [x] Runtime validation throws errors on missing keys
- [x] Clear error messages with setup instructions
- [x] .env.example templates for all required variables
- [x] .env files in .gitignore
- [x] Validation script to check configuration
- [x] Auto-validation on build and deploy
- [x] Comprehensive documentation
- [x] CI/CD integration examples

## Next Steps

1. **Immediate**: Remove `functions/.env` from git tracking (see SECURITY_NOTICE.md)
2. **Security**: Rotate the exposed API key
3. **Team**: Share ENV_SETUP.md with team members
4. **CI/CD**: Set up environment secrets in your CI/CD platform
5. **Production**: Use Firebase Secrets Manager for production deployment

## Support

For questions or issues:
- See [ENV_SETUP.md](./ENV_SETUP.md) for setup help
- See [SECURITY_NOTICE.md](./SECURITY_NOTICE.md) for security actions
- Check runtime validation error messages for specific guidance
- Run `npm run validate:env` to diagnose configuration issues

# Security Notice: Environment Variables

## ⚠️ Important: Remove functions/.env from Git

The `functions/.env` file was previously tracked in git and contains a real API key. This file needs to be removed from git history and the API key should be rotated.

### Immediate Actions Required

1. **Remove the file from git tracking** (while keeping it locally):
   ```bash
   git rm --cached functions/.env
   git commit -m "Remove functions/.env from version control"
   ```

2. **Rotate the compromised API key**:
   - Log in to https://dashboard.api-football.com/
   - Generate a new API key
   - Update your local `functions/.env` with the new key
   - Update production environment (Firebase Secrets Manager):
     ```bash
     firebase functions:secrets:set SPORTS_API_KEY
     ```

3. **Verify .gitignore is working**:
   ```bash
   git status
   # functions/.env should NOT appear in untracked files
   ```

### Why This Happened

The `functions/.env` file was committed before the `.gitignore` rule was in place. Git continues to track files that were added before being ignored.

### Prevention for Future

- ✅ The `.gitignore` files now properly exclude all `.env` files
- ✅ Runtime validation ensures missing keys are caught early
- ✅ The validation script (`npm run validate:env`) checks for placeholder values
- ✅ Build scripts auto-validate before deployment

### Verification Checklist

- [ ] `git status` shows `functions/.env` is not tracked
- [ ] Old API key has been revoked/rotated
- [ ] New API key is set in local `functions/.env`
- [ ] New API key is set in Firebase Secrets Manager for production
- [ ] `npm run validate:env` passes successfully

## Current Status

As of this security notice:

- ✅ Frontend `.env` was never tracked (properly ignored)
- ⚠️ Functions `functions/.env` WAS tracked and contains real API key
- ✅ All `.gitignore` files now properly exclude `.env` files
- ✅ Runtime validation prevents missing keys
- ✅ Validation scripts detect placeholder values

## For Team Members

If you're setting up the project for the first time:

1. Copy the example files:
   ```bash
   cp .env.example .env
   cp functions/.env.example functions/.env
   ```

2. Contact your team lead for the actual API keys (do NOT use keys from git history)

3. Validate your setup:
   ```bash
   npm run validate:env
   ```

## Questions?

See [ENV_SETUP.md](./ENV_SETUP.md) for complete environment variable setup documentation.

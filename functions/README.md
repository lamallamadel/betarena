# BetArena Cloud Functions

## Environment Setup

### Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```
   SPORTS_API_KEY=your_actual_api_key_here
   ```

3. Run the emulator:
   ```bash
   npm run serve
   ```

### Production Deployment

#### Option 1: Firebase Functions Config (Legacy)
```bash
firebase functions:config:set sports.api_key="YOUR_API_KEY"
firebase deploy --only functions
```

To view current config:
```bash
firebase functions:config:get
```

#### Option 2: Firebase Secrets Manager (Recommended)
```bash
firebase functions:secrets:set SPORTS_API_KEY
# Enter your API key when prompted

firebase deploy --only functions
```

To list secrets:
```bash
firebase functions:secrets:access SPORTS_API_KEY
```

#### Option 3: Environment Variables in CI/CD

For GitHub Actions or other CI/CD pipelines, set environment variables in your pipeline configuration and ensure they're available during the `firebase deploy` command.

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run serve` - Build and run Firebase emulators
- `npm run deploy` - Deploy functions to Firebase
- `npm run logs` - View function logs

## Required Environment Variables

| Variable | Description | Required | Validation |
|----------|-------------|----------|------------|
| `SPORTS_API_KEY` | API key from api-football.com | Yes | Runtime check in `src/sportsapi.ts` |

**Runtime Validation**: The `SPORTS_API_KEY` is validated on first use in `src/sportsapi.ts`. If missing, a descriptive error will be thrown with setup instructions for both local and production environments.

Get your API key: https://dashboard.api-football.com/ (free tier: 100 requests/day)

## Security Notes

- Never commit `.env` files to version control
- Use Firebase Secrets Manager for production deployments
- Rotate API keys regularly
- Monitor API usage to detect unauthorized access
- All environment variables are validated at runtime to prevent silent failures

## Troubleshooting

### "Missing required environment variable: SPORTS_API_KEY"

**Local Development**: Ensure `functions/.env` exists and contains your API key.

**Production**: Use Firebase Secrets Manager:
```bash
firebase functions:secrets:set SPORTS_API_KEY
firebase deploy --only functions
```

See [../ENV_SETUP.md](../ENV_SETUP.md) for detailed troubleshooting.

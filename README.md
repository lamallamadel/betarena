# BetArena - Football Predictions Platform

A football predictions and social engagement web application where users wager virtual currency on match outcomes.

## Quick Start

### Prerequisites

- Node.js 18+ (Node 22 recommended for Cloud Functions)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)

### Frontend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd betarena
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Cloud Functions Setup

1. Navigate to the functions directory:
   ```bash
   cd functions
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `functions/.env` and add your Sports API key:
   ```
   SPORTS_API_KEY=your_api_football_key
   ```

5. Run the emulator:
   ```bash
   npm run serve
   ```

6. Deploy to Firebase (when ready):
   ```bash
   npm run deploy
   ```

## Environment Variables

**📖 See [ENV_SETUP.md](./ENV_SETUP.md) for complete setup guide including:**
- Runtime validation details
- Production deployment options
- CI/CD configuration
- Troubleshooting tips

### Frontend (Root `.env`)

All frontend environment variables must be prefixed with `VITE_`:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID | Yes |

**Runtime Validation**: All variables are validated on startup in `src/config/firebase.ts`. Missing variables will throw clear errors with setup instructions.

### Backend (Functions `.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `SPORTS_API_KEY` | API-Football API key | Yes |

**Runtime Validation**: The API key is validated on first use in `functions/src/sportsapi.ts`. Missing key will throw an error with setup instructions.

## Available Scripts

### Frontend

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Cloud Functions

- `cd functions && npm run build` - Compile TypeScript
- `cd functions && npm run serve` - Run Firebase emulators
- `cd functions && npm run deploy` - Deploy to Firebase
- `cd functions && npm run logs` - View function logs

## Security

- **Never commit `.env` files** - They contain sensitive API keys
- `.env.example` files are provided as templates
- For production deployments, use Firebase Secrets Manager or your CI/CD platform's secret management
- All environment variables have runtime validation to prevent deployment with missing configuration

## Documentation

- [ENV_SETUP.md](./ENV_SETUP.md) - **Environment variables setup guide** (start here!)
- [ENVIRONMENT_MIGRATION.md](./ENVIRONMENT_MIGRATION.md) - Environment variables migration details
- [SECURITY_NOTICE.md](./SECURITY_NOTICE.md) - Security notice about tracked .env file
- [CLAUDE.md](./CLAUDE.md) - Comprehensive codebase guide
- [functions/README.md](./functions/README.md) - Cloud Functions documentation
- [docs/specs.draft-v1.md](./docs/specs.draft-v1.md) - Full functional specification

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **API**: API-Football (match data)
- **Cloud Functions**: Node 22, TypeScript

## License

Private project - All rights reserved

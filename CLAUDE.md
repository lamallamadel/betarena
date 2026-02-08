# CLAUDE.md — BetArena Codebase Guide

## Project Overview

BetArena is a football predictions and social engagement web application. Users wager virtual currency ("Coins") on match outcomes (1N2 winner, exact score, penalty miss) and interact through live chat rooms, leaderboards, and social sharing. **No real money is involved** — the economy is purely gamified.

The app targets the Moroccan Botola Pro league primarily, with support for major European leagues (Ligue 1, Premier League, La Liga, Serie A).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.9, Vite (rolldown-vite) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite` plugin) |
| Icons | lucide-react |
| Backend | Firebase (Auth, Firestore, Cloud Functions) |
| Cloud Functions | Node 24, TypeScript, firebase-functions v7 |
| Image Export | html-to-image (for social share story generation) |
| Data Layer | Firebase DataConnect (GraphQL schema in `dataconnect/`) |
| Linting | ESLint 9 flat config + typescript-eslint + react-hooks + react-refresh |

## Project Structure

```
betarena/
├── src/                          # Frontend React application
│   ├── main.tsx                  # Entry point — wraps App in AuthProvider
│   ├── App.tsx                   # Root component — view routing, state, navigation
│   ├── App.css                   # Global styles
│   ├── index.css                 # Base CSS imports (Tailwind)
│   ├── Maquette.tsx              # UI mockup/prototype component
│   ├── types/types.ts            # All TypeScript type definitions
│   ├── config/firebase.ts        # Firebase initialization (auth, db, analytics)
│   ├── context/AuthContext.tsx    # Auth provider — anonymous Firebase auth + Firestore profile
│   ├── data/mockData.ts          # Mock match data, leagues, lineups for development
│   ├── hooks/                    # Custom React hooks (business logic)
│   │   ├── useBetting.ts         # Core betting logic — placeBet, resolution engine, lock rules
│   │   ├── useMatchLive.ts       # Live match updates (Real data from Firestore)
│   │   ├── useMatchFeed.ts       # Match list fetching for Home view (Real data)
│   │   ├── useMatchPolling.ts    # Auto-refresh polling (60s interval)
│   │   ├── useChat.ts            # Chat room messaging
│   │   ├── useGamification.ts    # XP, levels, shop purchases
│   │   ├── useFavorites.ts       # Team/match favorites
│   │   ├── useSearch.ts          # Global search functionality
│   │   ├── useSocialShare.ts     # Share story image generation
│   │   └── useAdmin.ts           # Admin dashboard operations
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx        # App header with coins, notifications
│   │   │   └── HomeView.tsx      # Main home screen — match list, date nav, league filters
│   │   ├── match/
│   │   │   ├── MatchCard.tsx     # Match card in list view
│   │   │   ├── MatchCenterView.tsx  # Full match detail — scores, betting form, timeline
│   │   │   ├── matchHeader.tsx   # Match header in detail view
│   │   │   ├── matchTimeline.tsx # Match event timeline
│   │   │   ├── TimelineEvent.tsx # Individual timeline event
│   │   │   ├── PredictionTrends.tsx # Public vote percentages (RG-A04)
│   │   │   └── SoccerPitch.tsx   # Visual pitch/formation display
│   │   ├── betting/
│   │   │   └── bettingForm.tsx   # Bet placement form (1N2 + exact score)
│   │   ├── auth/
│   │   │   ├── Onboarding.tsx    # New user registration (pseudo + referral)
│   │   │   └── GuestWallModal.tsx # Read-only wall for guests
│   │   ├── social/
│   │   │   ├── SocialView.tsx    # Social hub — chat rooms
│   │   │   ├── chatRoom.tsx      # Chat room component
│   │   │   ├── LeaderboardView.tsx # Leaderboard display (global + season)
│   │   │   ├── leaderboard.tsx   # Leaderboard data component
│   │   │   ├── ShareModal.tsx    # Share prediction modal
│   │   │   └── ShareStoryModal.tsx # Generate shareable story image
│   │   ├── profile/
│   │   │   └── ProfileView.tsx   # User profile — stats, badges, history
│   │   ├── shop/
│   │   │   ├── Shop.tsx          # Shop item listing
│   │   │   └── ShopView.tsx      # Shop page wrapper
│   │   ├── search/
│   │   │   └── SearchOverlay.tsx # Global search overlay
│   │   ├── standings/
│   │   │   ├── StandingsTable.tsx # League standings table
│   │   │   ├── FormIndicator.tsx # Win/Draw/Loss form badges
│   │   │   └── index.ts         # Barrel export
│   │   ├── admin/
│   │   │   ├── AdminApp.tsx      # Admin entry point
│   │   │   ├── AdminDashboard.tsx # Admin stats dashboard
│   │   │   ├── AdminLayout.tsx   # Admin page layout
│   │   │   ├── AdminMatchList.tsx # Admin match management
│   │   │   ├── MatchOverrideModal.tsx # Manual score override (RG-G)
│   │   │   ├── adminTools.tsx    # Admin utility tools
│   │   │   └── index.ts         # Barrel export
│   │   └── ui/
│   │       ├── AvatarDisplay.tsx # User avatar with frame
│   │       ├── FavoriteButton.tsx # Star toggle for favorites
│   │       ├── NotificationsOverlay.tsx # Notification panel
│   │       ├── ProgressBar.tsx   # XP/level progress bar
│   │       └── ToastNotification.tsx # Toast messages
│   └── dataconnect-generated/    # Auto-generated Firebase DataConnect SDK
├── functions/                    # Firebase Cloud Functions (server-side)
│   ├── src/
│   │   ├── index.ts             # Function exports + global config
│   │   ├── resolveMatch.ts      # Match resolution engine (RG-B01 to RG-B03)
│   │   └── genkit-sample.ts     # Genkit AI sample (experimental)
│   ├── package.json             # Node 24, firebase-functions v7
│   └── tsconfig.json
├── genius/                       # Secondary Cloud Functions project
│   ├── src/index.ts
│   └── package.json
├── dataconnect/                  # Firebase DataConnect configuration
│   ├── dataconnect.yaml
│   ├── schema/schema.gql        # GraphQL schema (User, League, Team, Match, Prognostic)
│   ├── example/
│   │   ├── connector.yaml
│   │   └── queries.gql
│   └── seed_data.gql            # Sample seed data
├── docs/
│   └── specs.draft-v1.md        # Full functional specification (Modules A–G)
├── firebase.json                 # Firebase project config
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore index definitions
├── eslint.config.js             # ESLint 9 flat config
├── vite.config.ts               # Vite build config (React + Tailwind plugins)
├── tsconfig.json                # Root TypeScript config (references app + node)
├── tsconfig.app.json            # App-specific TS config
├── tsconfig.node.json           # Node-specific TS config
└── package.json                 # Root dependencies and scripts
```

## Key Commands

```bash
# Frontend development
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint check
npm run preview      # Preview production build locally

# Cloud Functions
cd functions && npm run build       # Compile TypeScript
cd functions && npm run serve       # Build + run Firebase emulators
cd functions && npm run deploy      # Deploy to Firebase
cd functions && npm run logs        # View function logs
```

## Architecture & Conventions

### Firestore Data Model

All app data lives under: `artifacts/{APP_ID}/users/{userId}/...`

- `APP_ID` = `"botola-v1"` (frontend) / `"betarena"` (Cloud Functions) — **note the inconsistency**
- User profile: `artifacts/{APP_ID}/users/{uid}/data/profile`
- Predictions: `artifacts/{APP_ID}/users/{uid}/predictions/{matchId}_{type}`
- Leaderboard: `leaderboard/{userId}` (top-level collection)

### Authentication

- **Anonymous auth only** — users authenticate anonymously via Firebase, then create a profile with a pseudo during onboarding
- Auth state is managed in `AuthContext.tsx` and provided app-wide via `<AuthProvider>`
- Profile creation grants 500 starting coins (+200 if a referral code is provided)

### View Routing

The app uses **manual view state** (no React Router). Navigation is driven by a `currentView` string state in `App.tsx`:
- `HOME`, `MATCH`, `SOCIAL`, `LEADERBOARD`, `PROFILE`, `SHOP`
- Admin mode: append `?admin=true` to URL
- Standings mode: append `?standings=true` to URL

### Betting System (Module A)

Business rules are codified in `src/hooks/useBetting.ts`:

| Rule | Description |
|---|---|
| RG-A01 | 1N2 bets locked at kickoff (`status !== 'PRE_MATCH'`) |
| RG-A02 | Exact score editable until 2nd half starts (locked at `LIVE_2ND_HALF` / `FINISHED`) |
| RG-A03 | Each bet costs variable coins (deducted atomically via Firestore transaction) |
| RG-A04 | Friends' picks hidden until match starts; global vote % is public |

Predictions use `UPSERT` logic: one active prediction per `(userId, matchId, type)`. Previous stakes are refunded atomically when updating a bet.

### Resolution Engine (Module B)

Server-side logic in `functions/src/resolveMatch.ts`:

- **Trigger**: Firestore `onDocumentUpdated` on `matches/{matchId}` when status changes to `FINISHED`
- **Alternative**: HTTP POST endpoint at `/resolveMatch`
- Resolves all PENDING predictions for the match
- Credits coins via atomic Firestore transactions
- Updates leaderboard entries
- Supports 3 calculation modes: `ODDS_MULTIPLIER`, `FIXED`, `PARI_MUTUEL`

### Match Statuses

```typescript
type MatchStatus = 'PRE_MATCH' | 'SCHEDULED' | 'LIVE_1ST_HALF' | 'HALF_TIME' |
                   'LIVE_2ND_HALF' | 'FINISHED' | 'LIVE' | 'CANCELLED' | 'POSTPONED';
```

### Component Naming

- File names use **mixed conventions**: PascalCase (`MatchCard.tsx`) and camelCase (`bettingForm.tsx`, `chatRoom.tsx`) coexist
- Components are exported as named exports (not default), except `App.tsx`
- Barrel exports (`index.ts`) exist for `admin/` and `standings/`

### Styling

- **Tailwind CSS v4** with the Vite plugin (no `tailwind.config.js` — uses CSS-first config)
- Dark theme throughout: `bg-slate-950`, `text-slate-200`, accent colors `emerald-500`, `yellow-500`
- Mobile-first design: `max-w-md` container centered in viewport
- Custom scrollbar hiding and slide-up animations via inline `<style>` in `App.tsx`

### Language

- UI text is in **French** (e.g., "Pari valid\u00e9", "Solde insuffisant", "Chargement...")
- Code comments are predominantly in **French**
- Variable/function names are in **English**
- Spec document (`docs/specs.draft-v1.md`) is in **French**

## Known Issues & Technical Debt

1. **APP_ID consistency**: Standardized on `"botola-v1"` across frontend and Cloud Functions. (Resolved)
2. **No test suite**: No unit tests, integration tests, or test configuration exists
3. **No React Router**: Navigation is manual state-driven, which doesn't support browser back/forward or deep links
4. **Firebase API key is hardcoded** in `src/config/firebase.ts` — should use environment variables
5. **Firestore rules are wide open**: Current rules allow all reads/writes until 2030 — needs proper security rules
6. **Mock data dependency**: Transitioning to real API integration (API-Football). (In Progress)
7. **Inconsistent file naming**: Mix of PascalCase and camelCase component files
8. **`any` types**: Heavy use of `any` throughout components (e.g., `selectedMatch`, match data, predictions)
9. **No error boundaries**: No React error boundary components
10. **`genius/` directory**: Secondary Cloud Functions project appears unused/experimental

## Business Rules Quick Reference

| Code | Rule | Module |
|---|---|---|
| RG-A01 | 1N2 locked at kickoff | Predictions |
| RG-A02 | Exact score editable until 2nd half | Predictions |
| RG-A03 | Variable coin stake, debited atomically | Predictions |
| RG-A04 | Friends' picks hidden pre-match; global % public | Predictions |
| RG-B01 | Result includes extra time + penalties | Resolution |
| RG-B02 | Configurable gain calculation (Odds/Fixed/Pari Mutuel) | Resolution |
| RG-B03 | Penalty miss: won if missed, void if not taken | Resolution |
| RG-B04 | Dual leaderboard: global + seasonal | Leaderboard |
| RG-B05 | Tiebreaker: alphabetical by pseudo | Leaderboard |
| RG-C01 | No direct API calls from client — proxy through backend | Live Match |
| RG-C02 | VAR annulled goals must update score + timeline | Live Match |
| RG-D01 | Auto-moderation: regex filter on banned words | Chat |
| RG-D02 | User reports: auto-hide after X reports | Chat |
| RG-F01 | +10 coins reward per share action | Social Share |
| RG-F02 | Max 3 rewarded shares per day | Social Share |
| RG-G01 | All admin actions logged immutably | Admin |

## Working With This Codebase

### Adding a New View
1. Create component in `src/components/{module}/`
2. Add view name to the `currentView` switch in `App.tsx`
3. Add navigation button if needed in the bottom nav bar

### Adding a New Hook
1. Create in `src/hooks/` following the `use{Feature}.ts` pattern
2. Import Firebase `db` and `APP_ID` from `src/config/firebase.ts`
3. Use Firestore `onSnapshot` for real-time data, `runTransaction` for atomic writes

### Adding a Cloud Function
1. Add to `functions/src/` as a new file
2. Export from `functions/src/index.ts`
3. Build with `cd functions && npm run build`
4. Deploy with `cd functions && npm run deploy`

### Modifying Types
All shared types live in `src/types/types.ts`. Key interfaces:
- `Match`, `MatchStatus` — match data and lifecycle
- `Prediction`, `PredictionType`, `PredictionStatus` — betting data
- `UserProfile`, `RichUserProfile` — user data (basic vs. enriched for UI)
- `LeaderboardPlayer` — leaderboard entries
- `CompetitionRules` — per-competition betting configuration

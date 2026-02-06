# BetArena

Football predictions and social engagement platform powered by virtual currency.

## Overview

BetArena lets fans predict football match outcomes using virtual Coins — no real money involved. The app covers the Moroccan Botola Pro and major European leagues (Ligue 1, Premier League, La Liga, Serie A).

**Core features:**
- **Predictions** — 1N2 (match result), Exact Score, and Penalty Miss bets
- **Live Match Center** — Real-time scores, timeline events, lineups
- **Social** — Chat rooms (global, per-match, private groups), social sharing
- **Gamification** — XP levels, leaderboards (global + seasonal), avatar shop
- **Admin** — Score overrides, user management, dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.9, Vite |
| Styling | Tailwind CSS v4 |
| Backend | Firebase (Auth, Firestore, Cloud Functions v7) |
| Cloud Functions | Node 24, TypeScript |
| Data Layer | Firebase DataConnect (GraphQL) |

## Getting Started

### Prerequisites

- Node.js 24+
- npm
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

```bash
# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### Development

```bash
# Start the Vite dev server
npm run dev

# Run Firebase emulators (Cloud Functions)
cd functions && npm run serve
```

### Build & Deploy

```bash
# Production build (TypeScript check + Vite build)
npm run build

# Lint
npm run lint

# Deploy Cloud Functions
cd functions && npm run deploy
```

## Project Structure

```
betarena/
├── src/                        # React frontend
│   ├── main.tsx                # Entry point (AuthProvider wrapper)
│   ├── App.tsx                 # Root component — view routing & state
│   ├── types/types.ts          # All TypeScript type definitions
│   ├── config/firebase.ts      # Firebase initialization
│   ├── context/AuthContext.tsx  # Auth provider (anonymous Firebase auth)
│   ├── hooks/                  # Business logic hooks
│   │   ├── useBetting.ts       # Betting: placement, locks, resolution
│   │   ├── useMatch.ts         # Match data fetching
│   │   ├── useMatchLive.ts     # Live match updates
│   │   ├── useMatchPolling.ts  # Auto-refresh (60s polling)
│   │   ├── useChat.ts          # Chat messaging
│   │   ├── useGamification.ts  # XP, levels, shop
│   │   ├── useFavorites.ts     # Favorites management
│   │   ├── useSearch.ts        # Global search
│   │   ├── useSocialShare.ts   # Share story generation
│   │   └── useAdmin.ts         # Admin operations
│   ├── components/             # UI components by module
│   │   ├── layout/             # Header, HomeView
│   │   ├── match/              # MatchCard, MatchCenterView, timeline
│   │   ├── betting/            # Betting form
│   │   ├── auth/               # Onboarding, GuestWallModal
│   │   ├── social/             # Chat, Leaderboard, Share modals
│   │   ├── profile/            # User profile
│   │   ├── shop/               # Coin shop
│   │   ├── search/             # Search overlay
│   │   ├── standings/          # League standings table
│   │   ├── admin/              # Admin dashboard & tools
│   │   └── ui/                 # Shared UI (Avatar, Toast, ProgressBar)
│   └── data/mockData.ts        # Mock data for development
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       ├── index.ts            # Function exports
│       └── resolveMatch.ts     # Match resolution engine
├── dataconnect/                # Firebase DataConnect (GraphQL schema)
├── docs/
│   └── specs.draft-v1.md       # Functional specifications (Modules A–G)
├── firebase.json               # Firebase project config
├── firestore.rules             # Firestore security rules
└── CLAUDE.md                   # Detailed codebase guide for AI assistants
```

## Prediction Types & Rules

| Type | Lock Rule | Gain Modes |
|---|---|---|
| **1N2** (Home/Draw/Away) | Locked at kickoff | Odds multiplier, Fixed, Pari Mutuel |
| **Exact Score** | Editable until 2nd half starts | Odds multiplier, Fixed, Pari Mutuel |
| **Penalty Miss** | Phase finale only | Fixed (void if player doesn't shoot) |

Bets use atomic Firestore transactions with UPSERT logic — one active prediction per `(user, match, type)`. Previous stakes are refunded when updating.

## Architecture Highlights

- **Authentication**: Anonymous Firebase auth with profile creation during onboarding (500 starting Coins)
- **Navigation**: State-driven view switching in `App.tsx` (`HOME`, `MATCH`, `SOCIAL`, `LEADERBOARD`, `PROFILE`, `SHOP`)
- **Resolution Engine**: Cloud Function triggered on match finish — resolves all PENDING predictions, credits wallets atomically, updates leaderboards
- **Firestore paths**: `artifacts/{APP_ID}/users/{uid}/data/profile` and `artifacts/{APP_ID}/users/{uid}/predictions/{id}`

## Documentation

- **Functional Specs**: [`docs/specs.draft-v1.md`](docs/specs.draft-v1.md) — Full specification covering Modules A (Predictions) through G (Admin)
- **AI Assistant Guide**: [`CLAUDE.md`](CLAUDE.md) — Detailed codebase guide with architecture, conventions, business rules, and known issues

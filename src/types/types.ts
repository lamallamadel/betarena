// src/types.ts

// Re-export Match-specific types from feature module
export type { Match, MatchStatus, MatchEvent, MatchEventType } from '../features/match/types';

export type PredictionType = '1N2' | 'EXACT_SCORE' | 'PENALTY_MISS';
export type PredictionStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';
export type CalculationMode = 'ODDS_MULTIPLIER' | 'FIXED';
export type MessageType = 'TEXT' | 'IMAGE' | 'GIF';

export interface UserProfile {
  uid: string;
  coins: number;
  pseudo: string;
  level: number;
  xp: number;
  dailyShareCount: number;
  lastShareDate: string;
  isAdmin?: boolean; // Role-based access control flag
  // Optional extended fields
  id?: string;
  avatar?: string;
  frame?: string;
  badges?: string[];
  stats?: {
    totalPredictions: number;
    winRate: string;
    precision: string;
    rank: string;
  };
  predictions?: any[];
  inventory?: string[];
  referralCode?: string;
  referredBy?: string;
  lastDailyBonus?: number;
}

export interface Prediction {
  id: number | string;
  matchId: string;
  type: PredictionType;
  selection: string;
  odd: number;
  amount: number;
  gain: number;
  status: PredictionStatus;
  is_settled: boolean;
  settled_at: string | null;
  timestamp: number;
  match_final_score: string | null;
  match_had_extra_time: boolean;
  match_had_penalty_shootout: boolean;
  potentialGain?: number;
}

export interface RichUserProfile {
  uid: string; // Added for compatibility
  username: string;
  avatar: string;
  frame: string;
  level: number;
  xp: number;
  coins: number;
  season_coins?: number; // RG-B04: Coins de la saison en cours
  badges: string[];
  stats: {
    totalPredictions: number;
    winRate: string;
    precision: string;
    rank: string;
    seasonRank?: string; // RG-B04: Rang de la saison
  };
  referralCode: string;
  predictions: Prediction[];
  inventory?: string[];
}

export interface CompetitionRules {
  calculation_mode: CalculationMode;
  points_correct_1n2: number | null;
  points_correct_score: number | null;
  include_extra_time: boolean;
}

export interface LeaderboardPlayer {
  rank: number;
  user: string;
  coins: number;
  season_coins?: number;
  level: number;
  avatar: string;
  trend: 'up' | 'down' | 'stable';
  total_predictions?: number;
  win_rate?: number;
}

// ============================================
// MODULE L: Le Marché & La Bourse (Marketplace)
// ============================================

export type CardScarcity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED';
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface PlayerReference {
  id: string;
  name: string;
  club: string;
  position: PlayerPosition;
  photo?: string;
  base_value: number;
}

export interface Card {
  id: string;
  player_reference_id: string;
  player: PlayerReference;
  owner_id: string;
  scarcity: CardScarcity;
  serial_number: number;
  max_supply: number;
  is_locked: boolean;
  instance_id: number;
}

export interface MarketListing {
  id: string;
  card_id: string;
  card: Card;
  seller_id: string;
  seller_pseudo: string;
  price: number;
  net_seller: number;
  status: ListingStatus;
  created_at: number;
}

export interface Pack {
  id: string;
  name: string;
  price: number;
  contents: { scarcity: CardScarcity; count: number }[];
  stock: number;
  instance_id: number;
}

export interface PriceHistory {
  date: string;
  avg_price: number;
}

// ============================================
// MODULE M: Gestion d'Équipe (Ultimate Fantazia)
// ============================================

export type GameweekStatus = 'OPEN' | 'LIVE' | 'FINISHED' | 'RESOLVED';
export type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '5-3-2' | '3-4-3' | '4-5-1';
export type LineupStatus = 'DRAFT' | 'SAVED' | 'LOCKED';

export interface Gameweek {
  id: string;
  number: number;
  deadline_at: number;
  status: GameweekStatus;
}

export interface Lineup {
  id: string;
  user_id: string;
  gameweek_id: string;
  formation: Formation;
  captain_id?: string;
  score_total: number;
  status: LineupStatus;
}

export interface LineupPlayer {
  card_id: string;
  card: Card;
  position_slot: number;
  is_subbed_in: boolean;
  points?: number;
}

export const SCORING_RULES = {
  presence_60min: 2,
  goal: { GK: 6, DEF: 6, MID: 5, FWD: 4 } as Record<PlayerPosition, number>,
  assist: 3,
  clean_sheet: 4,
  yellow_card: -1,
  red_card: -3,
  goals_conceded_per_2: -1,
};

export const VALID_FORMATIONS: Record<Formation, { GK: number; DEF: number; MID: number; FWD: number }> = {
  '4-4-2': { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  '4-3-3': { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  '3-5-2': { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  '5-3-2': { GK: 1, DEF: 5, MID: 3, FWD: 2 },
  '3-4-3': { GK: 1, DEF: 3, MID: 4, FWD: 3 },
  '4-5-1': { GK: 1, DEF: 4, MID: 5, FWD: 1 },
};

// ============================================
// MODULE N: Mode Imaginaire (Blitz 5)
// ============================================

export type BlitzStatus = 'OPEN' | 'LIVE' | 'COMPLETED';
export type DraftCardTier = 'GOLD' | 'SILVER' | 'BRONZE';

export interface BlitzTournament {
  id: string;
  name: string;
  start_time: number;
  entry_fee: number;
  rake_percent: number;
  prize_pool: number;
  participant_count: number;
  status: BlitzStatus;
  payout_structure: { top_percent: number; share: number }[];
}

export interface DraftCard {
  player_reference_id: string;
  player: PlayerReference;
  tier: DraftCardTier;
}

export interface BlitzEntry {
  id: string;
  tournament_id: string;
  user_id: string;
  draft_pool: DraftCard[];
  selected_lineup: DraftCard[];
  total_score: number;
  rank: number;
  win_amount: number;
  created_at: number;
}

// ============================================
// Feature Flags System
// ============================================

export type Environment = 'dev' | 'staging' | 'prod';

export interface FeatureFlagsConfig {
  debug_mode: boolean;
  experimental_features: {
    ultimate_fantazia: boolean;
    blitz_mode: boolean;
    marketplace: boolean;
    social_stories: boolean;
    voice_chat: boolean;
  };
  sync_intervals: {
    match_polling_seconds: number;
    leaderboard_refresh_seconds: number;
    chat_refresh_seconds: number;
    api_quota_check_minutes: number;
  };
  api_settings: {
    enable_api_calls: boolean;
    max_daily_calls: number;
    enable_caching: boolean;
    cache_ttl_minutes: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    allowed_users: string[];
  };
  last_updated: number;
  updated_by: string;
}

export interface EnvironmentConfig {
  environment: Environment;
  flags: FeatureFlagsConfig;
}

// ============================================
// Analytics System (Year 5 Features)
// ============================================

export interface ChampionVarianceData {
  matchId: string;
  timestamp: number;
  totalBets: number;
  uniqueUsers: number;
  selections: {
    selection: string;
    count: number;
    percentage: number;
    totalStaked: number;
  }[];
  varianceScore: number;
  concentrationIndex: number;
}

export interface Bottom50RetentionData {
  date: string;
  timestamp: number;
  totalUsers: number;
  bottom50Count: number;
  activeBottom50: number;
  retentionRate: number;
  avgBetsPerUser: number;
  avgCoinsSpent: number;
}

export interface UserActivitySnapshot {
  userId: string;
  rank: number;
  isBottom50: boolean;
  betsPlaced: number;
  coinsSpent: number;
  lastActiveAt: number;
}

// ============================================
// Offline Mode & Sync Queue System
// ============================================

export type SyncJobType =
  | 'FIXTURES'
  | 'LIVE_MATCH'
  | 'LIVE_ALL'
  | 'STANDINGS'
  | 'EVENTS'
  | 'LINEUPS'
  | 'ODDS';

export type SyncJobStatus =
  | 'PENDING'
  | 'RETRYING'
  | 'FAILED'
  | 'COMPLETED';

export interface SyncJob {
  id: string;
  type: SyncJobType;
  status: SyncJobStatus;
  params: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: number;
  nextRetry?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiHealthStatus {
  isOnline: boolean;
  lastSuccessfulCall?: number;
  consecutiveFailures: number;
  lastError?: string;
  estimatedRecoveryTime?: number;
}

export interface DataStaleness {
  isFresh: boolean;
  lastUpdate?: number;
  minutesSinceUpdate?: number;
  message?: string;
  severity: 'ok' | 'warning' | 'stale' | 'critical';
}
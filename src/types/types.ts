// src/types.ts

export type MatchStatus = 'PRE_MATCH' | 'LIVE_1ST_HALF' | 'HALF_TIME' | 'LIVE_2ND_HALF' | 'FINISHED' | 'SCHEDULED' | 'LIVE' | 'CANCELLED' | 'POSTPONED';
export type PredictionType = '1N2' | 'EXACT_SCORE' | 'PENALTY_MISS';
export type PredictionStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';
export type CalculationMode = 'ODDS_MULTIPLIER' | 'FIXED';
export type MessageType = 'TEXT' | 'IMAGE' | 'GIF';
export type MatchEventType = 'GOAL' | 'CARD_YELLOW' | 'CARD_RED' | 'CORNER' | 'SUBSTITUTION' | 'VAR' | 'WHISTLE';

export interface UserProfile {
  uid: string;
  coins: number;
  pseudo: string;
  level: number;
  xp: number;
  dailyShareCount: number;
  lastShareDate: string;
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

export interface Match {
  id: string;
  api_id?: number;
  competition: string;
  league_id?: number;
  league_logo?: string;
  league_round?: string;
  home: string;
  away: string;
  home_id?: number;
  away_id?: number;
  homeLogo: string;
  awayLogo: string;
  time: string;
  kickoff_at: any; // Firestore Timestamp
  status: MatchStatus;
  minute: number;
  score: {
    h: number;
    a: number;
  };
  odds?: {
    h: number;
    n: number;
    a: number;
  };
  favorite?: boolean;
  lineups?: {
    confirmed: boolean;
    home: {
      formation: string;
      starters: Array<{ name: string; num: number; pos?: string; x: number; y: number }>;
      bench: string[];
    };
    away: {
      formation: string;
      starters: Array<{ name: string; num: number; pos?: string; x: number; y: number }>;
      bench: string[];
    };
  };
  referee?: string;
  hadPenaltyShootout?: boolean;
  penaltyScore?: { h: number; a: number } | null;
}

export interface Prediction {
  id: number | string;
  match: string;
  type: PredictionType;
  selection: string;
  odd: number;
  amount: number;
  gain: number;
  status: PredictionStatus;
  is_settled: boolean;
  settled_at: string | null;
  match_final_score: string | null;
  match_had_extra_time: boolean;
  match_had_penalty_shootout: boolean;
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
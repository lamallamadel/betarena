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
  odds: string;
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute: number;
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
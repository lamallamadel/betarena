// src/types.ts

export type MatchStatus = 'PRE_MATCH' | 'LIVE_1ST_HALF' | 'HALF_TIME' | 'LIVE_2ND_HALF' | 'FINISHED';
export type PredictionType = '1N2' | 'EXACT_SCORE' | 'PENALTY_MISS';
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

export interface RichUserProfile {
  username: string;
  avatar: string;
  frame: string;
  level: number;
  xp: number;
  coins: number;
  badges: string[];
  stats: {
    totalPredictions: number;
    winRate: string;
    precision: string;
    rank: string;
  };
  referralCode: string;
  predictions: any[];
  inventory?: string[];
}
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
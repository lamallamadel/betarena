// src/features/match/types.ts

export type MatchStatus = 'PRE_MATCH' | 'LIVE_1ST_HALF' | 'HALF_TIME' | 'LIVE_2ND_HALF' | 'FINISHED' | 'SCHEDULED' | 'LIVE' | 'CANCELLED' | 'POSTPONED';

export type MatchEventType = 'GOAL' | 'CARD_YELLOW' | 'CARD_RED' | 'CORNER' | 'SUBSTITUTION' | 'VAR' | 'WHISTLE';

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
  updated_at?: any; // Firestore Timestamp
}

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  minute: number;
  team: 'home' | 'away' | 'system';
  player_main?: string;
  player_assist?: string;
  is_cancelled?: boolean;
  text?: string;
  timestamp?: number;
}

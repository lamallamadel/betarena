// src/features/betting/types.ts

export type PredictionType = '1N2' | 'EXACT_SCORE' | 'PENALTY_MISS';
export type PredictionStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';
export type CalculationMode = 'ODDS_MULTIPLIER' | 'FIXED';

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
}

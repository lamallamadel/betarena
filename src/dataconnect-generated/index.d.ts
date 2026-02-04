import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreatePrognosticData {
  prognostic_insert: Prognostic_Key;
}

export interface CreatePrognosticVariables {
  matchId: UUIDString;
  predictedAwayScore?: number | null;
  predictedHomeScore?: number | null;
  predictedOutcome: string;
  notes?: string | null;
}

export interface GetLeaderboardData {
  leaderboardEntries: ({
    user: {
      displayName: string;
    };
      totalPoints: number;
      rank: number;
  })[];
}

export interface GetMatchesData {
  matches: ({
    id: UUIDString;
    homeTeam: {
      name: string;
    };
      awayTeam: {
        name: string;
      };
        matchDate: TimestampString;
        status: string;
  } & Match_Key)[];
}

export interface LeaderboardEntry_Key {
  id: UUIDString;
  __typename?: 'LeaderboardEntry_Key';
}

export interface League_Key {
  id: UUIDString;
  __typename?: 'League_Key';
}

export interface Match_Key {
  id: UUIDString;
  __typename?: 'Match_Key';
}

export interface Prognostic_Key {
  id: UUIDString;
  __typename?: 'Prognostic_Key';
}

export interface Team_Key {
  id: UUIDString;
  __typename?: 'Team_Key';
}

export interface UpdateUserFavoriteTeamData {
  user_update?: User_Key | null;
}

export interface UpdateUserFavoriteTeamVariables {
  teamId?: UUIDString | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreatePrognosticRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePrognosticVariables): MutationRef<CreatePrognosticData, CreatePrognosticVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePrognosticVariables): MutationRef<CreatePrognosticData, CreatePrognosticVariables>;
  operationName: string;
}
export const createPrognosticRef: CreatePrognosticRef;

export function createPrognostic(vars: CreatePrognosticVariables): MutationPromise<CreatePrognosticData, CreatePrognosticVariables>;
export function createPrognostic(dc: DataConnect, vars: CreatePrognosticVariables): MutationPromise<CreatePrognosticData, CreatePrognosticVariables>;

interface GetMatchesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMatchesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMatchesData, undefined>;
  operationName: string;
}
export const getMatchesRef: GetMatchesRef;

export function getMatches(): QueryPromise<GetMatchesData, undefined>;
export function getMatches(dc: DataConnect): QueryPromise<GetMatchesData, undefined>;

interface GetLeaderboardRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetLeaderboardData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetLeaderboardData, undefined>;
  operationName: string;
}
export const getLeaderboardRef: GetLeaderboardRef;

export function getLeaderboard(): QueryPromise<GetLeaderboardData, undefined>;
export function getLeaderboard(dc: DataConnect): QueryPromise<GetLeaderboardData, undefined>;

interface UpdateUserFavoriteTeamRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpdateUserFavoriteTeamVariables): MutationRef<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: UpdateUserFavoriteTeamVariables): MutationRef<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;
  operationName: string;
}
export const updateUserFavoriteTeamRef: UpdateUserFavoriteTeamRef;

export function updateUserFavoriteTeam(vars?: UpdateUserFavoriteTeamVariables): MutationPromise<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;
export function updateUserFavoriteTeam(dc: DataConnect, vars?: UpdateUserFavoriteTeamVariables): MutationPromise<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;


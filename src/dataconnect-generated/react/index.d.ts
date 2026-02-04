import { CreatePrognosticData, CreatePrognosticVariables, GetMatchesData, GetLeaderboardData, UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreatePrognostic(options?: useDataConnectMutationOptions<CreatePrognosticData, FirebaseError, CreatePrognosticVariables>): UseDataConnectMutationResult<CreatePrognosticData, CreatePrognosticVariables>;
export function useCreatePrognostic(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePrognosticData, FirebaseError, CreatePrognosticVariables>): UseDataConnectMutationResult<CreatePrognosticData, CreatePrognosticVariables>;

export function useGetMatches(options?: useDataConnectQueryOptions<GetMatchesData>): UseDataConnectQueryResult<GetMatchesData, undefined>;
export function useGetMatches(dc: DataConnect, options?: useDataConnectQueryOptions<GetMatchesData>): UseDataConnectQueryResult<GetMatchesData, undefined>;

export function useGetLeaderboard(options?: useDataConnectQueryOptions<GetLeaderboardData>): UseDataConnectQueryResult<GetLeaderboardData, undefined>;
export function useGetLeaderboard(dc: DataConnect, options?: useDataConnectQueryOptions<GetLeaderboardData>): UseDataConnectQueryResult<GetLeaderboardData, undefined>;

export function useUpdateUserFavoriteTeam(options?: useDataConnectMutationOptions<UpdateUserFavoriteTeamData, FirebaseError, UpdateUserFavoriteTeamVariables | void>): UseDataConnectMutationResult<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;
export function useUpdateUserFavoriteTeam(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserFavoriteTeamData, FirebaseError, UpdateUserFavoriteTeamVariables | void>): UseDataConnectMutationResult<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;

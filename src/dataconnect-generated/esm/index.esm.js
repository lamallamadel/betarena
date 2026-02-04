import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'betarena-app',
  location: 'us-east4'
};

export const createPrognosticRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePrognostic', inputVars);
}
createPrognosticRef.operationName = 'CreatePrognostic';

export function createPrognostic(dcOrVars, vars) {
  return executeMutation(createPrognosticRef(dcOrVars, vars));
}

export const getMatchesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMatches');
}
getMatchesRef.operationName = 'GetMatches';

export function getMatches(dc) {
  return executeQuery(getMatchesRef(dc));
}

export const getLeaderboardRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLeaderboard');
}
getLeaderboardRef.operationName = 'GetLeaderboard';

export function getLeaderboard(dc) {
  return executeQuery(getLeaderboardRef(dc));
}

export const updateUserFavoriteTeamRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserFavoriteTeam', inputVars);
}
updateUserFavoriteTeamRef.operationName = 'UpdateUserFavoriteTeam';

export function updateUserFavoriteTeam(dcOrVars, vars) {
  return executeMutation(updateUserFavoriteTeamRef(dcOrVars, vars));
}


const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'betarena-app',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createPrognosticRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePrognostic', inputVars);
}
createPrognosticRef.operationName = 'CreatePrognostic';
exports.createPrognosticRef = createPrognosticRef;

exports.createPrognostic = function createPrognostic(dcOrVars, vars) {
  return executeMutation(createPrognosticRef(dcOrVars, vars));
};

const getMatchesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMatches');
}
getMatchesRef.operationName = 'GetMatches';
exports.getMatchesRef = getMatchesRef;

exports.getMatches = function getMatches(dc) {
  return executeQuery(getMatchesRef(dc));
};

const getLeaderboardRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLeaderboard');
}
getLeaderboardRef.operationName = 'GetLeaderboard';
exports.getLeaderboardRef = getLeaderboardRef;

exports.getLeaderboard = function getLeaderboard(dc) {
  return executeQuery(getLeaderboardRef(dc));
};

const updateUserFavoriteTeamRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserFavoriteTeam', inputVars);
}
updateUserFavoriteTeamRef.operationName = 'UpdateUserFavoriteTeam';
exports.updateUserFavoriteTeamRef = updateUserFavoriteTeamRef;

exports.updateUserFavoriteTeam = function updateUserFavoriteTeam(dcOrVars, vars) {
  return executeMutation(updateUserFavoriteTeamRef(dcOrVars, vars));
};

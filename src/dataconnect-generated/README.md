# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMatches*](#getmatches)
  - [*GetLeaderboard*](#getleaderboard)
- [**Mutations**](#mutations)
  - [*CreatePrognostic*](#createprognostic)
  - [*UpdateUserFavoriteTeam*](#updateuserfavoriteteam)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMatches
You can execute the `GetMatches` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMatches(): QueryPromise<GetMatchesData, undefined>;

interface GetMatchesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMatchesData, undefined>;
}
export const getMatchesRef: GetMatchesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMatches(dc: DataConnect): QueryPromise<GetMatchesData, undefined>;

interface GetMatchesRef {
  ...
  (dc: DataConnect): QueryRef<GetMatchesData, undefined>;
}
export const getMatchesRef: GetMatchesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMatchesRef:
```typescript
const name = getMatchesRef.operationName;
console.log(name);
```

### Variables
The `GetMatches` query has no variables.
### Return Type
Recall that executing the `GetMatches` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMatchesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetMatches`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMatches } from '@dataconnect/generated';


// Call the `getMatches()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMatches();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMatches(dataConnect);

console.log(data.matches);

// Or, you can use the `Promise` API.
getMatches().then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

### Using `GetMatches`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMatchesRef } from '@dataconnect/generated';


// Call the `getMatchesRef()` function to get a reference to the query.
const ref = getMatchesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMatchesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

## GetLeaderboard
You can execute the `GetLeaderboard` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getLeaderboard(): QueryPromise<GetLeaderboardData, undefined>;

interface GetLeaderboardRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetLeaderboardData, undefined>;
}
export const getLeaderboardRef: GetLeaderboardRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getLeaderboard(dc: DataConnect): QueryPromise<GetLeaderboardData, undefined>;

interface GetLeaderboardRef {
  ...
  (dc: DataConnect): QueryRef<GetLeaderboardData, undefined>;
}
export const getLeaderboardRef: GetLeaderboardRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getLeaderboardRef:
```typescript
const name = getLeaderboardRef.operationName;
console.log(name);
```

### Variables
The `GetLeaderboard` query has no variables.
### Return Type
Recall that executing the `GetLeaderboard` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetLeaderboardData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetLeaderboardData {
  leaderboardEntries: ({
    user: {
      displayName: string;
    };
      totalPoints: number;
      rank: number;
  })[];
}
```
### Using `GetLeaderboard`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getLeaderboard } from '@dataconnect/generated';


// Call the `getLeaderboard()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getLeaderboard();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getLeaderboard(dataConnect);

console.log(data.leaderboardEntries);

// Or, you can use the `Promise` API.
getLeaderboard().then((response) => {
  const data = response.data;
  console.log(data.leaderboardEntries);
});
```

### Using `GetLeaderboard`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getLeaderboardRef } from '@dataconnect/generated';


// Call the `getLeaderboardRef()` function to get a reference to the query.
const ref = getLeaderboardRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getLeaderboardRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.leaderboardEntries);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.leaderboardEntries);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreatePrognostic
You can execute the `CreatePrognostic` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPrognostic(vars: CreatePrognosticVariables): MutationPromise<CreatePrognosticData, CreatePrognosticVariables>;

interface CreatePrognosticRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePrognosticVariables): MutationRef<CreatePrognosticData, CreatePrognosticVariables>;
}
export const createPrognosticRef: CreatePrognosticRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPrognostic(dc: DataConnect, vars: CreatePrognosticVariables): MutationPromise<CreatePrognosticData, CreatePrognosticVariables>;

interface CreatePrognosticRef {
  ...
  (dc: DataConnect, vars: CreatePrognosticVariables): MutationRef<CreatePrognosticData, CreatePrognosticVariables>;
}
export const createPrognosticRef: CreatePrognosticRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPrognosticRef:
```typescript
const name = createPrognosticRef.operationName;
console.log(name);
```

### Variables
The `CreatePrognostic` mutation requires an argument of type `CreatePrognosticVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreatePrognosticVariables {
  matchId: UUIDString;
  predictedAwayScore?: number | null;
  predictedHomeScore?: number | null;
  predictedOutcome: string;
  notes?: string | null;
}
```
### Return Type
Recall that executing the `CreatePrognostic` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePrognosticData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePrognosticData {
  prognostic_insert: Prognostic_Key;
}
```
### Using `CreatePrognostic`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPrognostic, CreatePrognosticVariables } from '@dataconnect/generated';

// The `CreatePrognostic` mutation requires an argument of type `CreatePrognosticVariables`:
const createPrognosticVars: CreatePrognosticVariables = {
  matchId: ..., 
  predictedAwayScore: ..., // optional
  predictedHomeScore: ..., // optional
  predictedOutcome: ..., 
  notes: ..., // optional
};

// Call the `createPrognostic()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPrognostic(createPrognosticVars);
// Variables can be defined inline as well.
const { data } = await createPrognostic({ matchId: ..., predictedAwayScore: ..., predictedHomeScore: ..., predictedOutcome: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPrognostic(dataConnect, createPrognosticVars);

console.log(data.prognostic_insert);

// Or, you can use the `Promise` API.
createPrognostic(createPrognosticVars).then((response) => {
  const data = response.data;
  console.log(data.prognostic_insert);
});
```

### Using `CreatePrognostic`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPrognosticRef, CreatePrognosticVariables } from '@dataconnect/generated';

// The `CreatePrognostic` mutation requires an argument of type `CreatePrognosticVariables`:
const createPrognosticVars: CreatePrognosticVariables = {
  matchId: ..., 
  predictedAwayScore: ..., // optional
  predictedHomeScore: ..., // optional
  predictedOutcome: ..., 
  notes: ..., // optional
};

// Call the `createPrognosticRef()` function to get a reference to the mutation.
const ref = createPrognosticRef(createPrognosticVars);
// Variables can be defined inline as well.
const ref = createPrognosticRef({ matchId: ..., predictedAwayScore: ..., predictedHomeScore: ..., predictedOutcome: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPrognosticRef(dataConnect, createPrognosticVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.prognostic_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.prognostic_insert);
});
```

## UpdateUserFavoriteTeam
You can execute the `UpdateUserFavoriteTeam` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateUserFavoriteTeam(vars?: UpdateUserFavoriteTeamVariables): MutationPromise<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;

interface UpdateUserFavoriteTeamRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpdateUserFavoriteTeamVariables): MutationRef<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;
}
export const updateUserFavoriteTeamRef: UpdateUserFavoriteTeamRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUserFavoriteTeam(dc: DataConnect, vars?: UpdateUserFavoriteTeamVariables): MutationPromise<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;

interface UpdateUserFavoriteTeamRef {
  ...
  (dc: DataConnect, vars?: UpdateUserFavoriteTeamVariables): MutationRef<UpdateUserFavoriteTeamData, UpdateUserFavoriteTeamVariables>;
}
export const updateUserFavoriteTeamRef: UpdateUserFavoriteTeamRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserFavoriteTeamRef:
```typescript
const name = updateUserFavoriteTeamRef.operationName;
console.log(name);
```

### Variables
The `UpdateUserFavoriteTeam` mutation has an optional argument of type `UpdateUserFavoriteTeamVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateUserFavoriteTeamVariables {
  teamId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `UpdateUserFavoriteTeam` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserFavoriteTeamData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserFavoriteTeamData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUserFavoriteTeam`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUserFavoriteTeam, UpdateUserFavoriteTeamVariables } from '@dataconnect/generated';

// The `UpdateUserFavoriteTeam` mutation has an optional argument of type `UpdateUserFavoriteTeamVariables`:
const updateUserFavoriteTeamVars: UpdateUserFavoriteTeamVariables = {
  teamId: ..., // optional
};

// Call the `updateUserFavoriteTeam()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUserFavoriteTeam(updateUserFavoriteTeamVars);
// Variables can be defined inline as well.
const { data } = await updateUserFavoriteTeam({ teamId: ..., });
// Since all variables are optional for this mutation, you can omit the `UpdateUserFavoriteTeamVariables` argument.
const { data } = await updateUserFavoriteTeam();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUserFavoriteTeam(dataConnect, updateUserFavoriteTeamVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUserFavoriteTeam(updateUserFavoriteTeamVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUserFavoriteTeam`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserFavoriteTeamRef, UpdateUserFavoriteTeamVariables } from '@dataconnect/generated';

// The `UpdateUserFavoriteTeam` mutation has an optional argument of type `UpdateUserFavoriteTeamVariables`:
const updateUserFavoriteTeamVars: UpdateUserFavoriteTeamVariables = {
  teamId: ..., // optional
};

// Call the `updateUserFavoriteTeamRef()` function to get a reference to the mutation.
const ref = updateUserFavoriteTeamRef(updateUserFavoriteTeamVars);
// Variables can be defined inline as well.
const ref = updateUserFavoriteTeamRef({ teamId: ..., });
// Since all variables are optional for this mutation, you can omit the `UpdateUserFavoriteTeamVariables` argument.
const ref = updateUserFavoriteTeamRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserFavoriteTeamRef(dataConnect, updateUserFavoriteTeamVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```


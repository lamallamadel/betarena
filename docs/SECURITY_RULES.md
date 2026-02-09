# Firestore Security Rules Documentation

## Overview

BetArena now implements comprehensive role-based access control (RBAC) for all Firestore operations. The security rules enforce proper authentication, authorization, and data ownership validation across all collections.

## Key Security Principles

1. **Authentication Required**: All operations require authenticated users (no anonymous access)
2. **Role-Based Access Control**: Admin operations require `isAdmin: true` flag in user profile
3. **Data Ownership**: Users can only access their own private data
4. **Immutable Logs**: Admin logs and change logs cannot be modified or deleted
5. **Server-Side Operations**: Critical operations (resolution, leaderboard updates) are Cloud Functions only
6. **Marketplace Validation**: Transaction ownership and card ownership are validated

## Admin Access Management

### Granting Admin Access

To grant admin access to a user, manually update their profile in Firestore:

**Path**: `artifacts/botola-v1/users/{userId}/data/profile`

**Field to Add/Update**:
```json
{
  "isAdmin": true
}
```

### Methods to Grant Admin Access

#### Option 1: Firebase Console (Recommended for first admin)
1. Open Firebase Console → Firestore Database
2. Navigate to: `artifacts/botola-v1/users/{userId}/data/profile`
3. Edit the document
4. Add field: `isAdmin` = `true` (boolean)
5. Save

#### Option 2: Firebase Admin SDK (Recommended for subsequent admins)
Create a Cloud Function for admin management:

```typescript
import * as admin from 'firebase-admin';

export const grantAdminAccess = functions.https.onCall(async (data, context) => {
  // Verify caller is admin
  const callerProfile = await admin.firestore()
    .doc(`artifacts/botola-v1/users/${context.auth.uid}/data/profile`)
    .get();
  
  if (!callerProfile.data()?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can grant admin access');
  }
  
  // Grant admin access to target user
  await admin.firestore()
    .doc(`artifacts/botola-v1/users/${data.targetUserId}/data/profile`)
    .update({ isAdmin: true });
  
  // Log the action
  await admin.firestore()
    .collection('artifacts/botola-v1/public/data/admin_logs')
    .add({
      adminId: context.auth.uid,
      adminName: callerProfile.data()?.pseudo,
      action: 'GRANT_ADMIN',
      targetId: data.targetUserId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  
  return { success: true };
});
```

#### Option 3: Firebase CLI + Admin SDK Script
Create a one-time script:

```typescript
// scripts/grantAdmin.ts
import * as admin from 'firebase-admin';

admin.initializeApp();

async function grantAdmin(userEmail: string) {
  const userRecord = await admin.auth().getUserByEmail(userEmail);
  const userId = userRecord.uid;
  
  await admin.firestore()
    .doc(`artifacts/botola-v1/users/${userId}/data/profile`)
    .update({ isAdmin: true });
  
  console.log(`✅ Admin access granted to ${userEmail} (${userId})`);
}

grantAdmin('admin@betarena.com')
  .then(() => process.exit(0))
  .catch(console.error);
```

### Revoking Admin Access

To revoke admin access, set `isAdmin: false` in the user's profile document. Only existing admins can perform this operation.

## Security Rules Structure

### User Data Collections

| Collection | Read Access | Write Access | Notes |
|------------|-------------|--------------|-------|
| `users/{userId}/data/profile` | Owner + Admins | Owner only | Users cannot self-promote to admin |
| `users/{userId}/predictions/{predictionId}` | Owner + Admins | Owner only | Users can create/update their predictions |
| `users/{userId}/cards/{cardId}` | All authenticated | Cloud Functions only | Public read for marketplace verification |
| `users/{userId}/lineups/{lineupId}` | Owner + Admins | Owner only | Cannot modify locked lineups |
| `users/{userId}/blitz_entries/{entryId}` | All authenticated | Cloud Functions only | Public read for leaderboards |
| `users/{userId}/favorites/{favoriteId}` | Owner only | Owner only | Private favorites |
| `users/{userId}/settings/{settingId}` | Owner only | Owner only | Private settings |
| `users/{userId}/notifications/{notificationId}` | Owner only | Cloud Functions create, Owner update/delete | Users can mark as read/delete |

### Public Data Collections

| Collection | Read Access | Write Access | Notes |
|------------|-------------|--------------|-------|
| `public/data/matches/{matchId}` | All authenticated | Admins only | Match data management |
| `public/data/matches/{matchId}/events/{eventId}` | All authenticated | Cloud Functions only | Live match events |
| `public/data/market_listings/{listingId}` | All authenticated | Seller (create/cancel) | Ownership validated, only CF can mark SOLD |
| `public/data/packs/{packId}` | All authenticated | Admins only | Pack configuration |
| `public/data/player_references/{playerId}` | All authenticated | Admins only | Player database |
| `public/data/price_history/{playerId}/entries/{entryId}` | All authenticated | Cloud Functions only | Market price tracking |
| `public/data/gameweeks/{gameweekId}` | All authenticated | Admins only | Fantasy gameweek management |
| `public/data/blitz_tournaments/{tournamentId}` | All authenticated | Admins only | Tournament configuration |
| `public/data/messages/{messageId}` | All authenticated | User creates, Admin deletes | Chat messages are immutable |
| `public/data/presence/{presenceId}` | All authenticated | Own presence only | Real-time presence tracking |
| `public/data/leagues/{leagueId}` | All authenticated | Admins only | League configuration |
| `public/data/teams/{teamId}` | All authenticated | Admins only | Team database |
| `public/data/standings/{standingId}` | All authenticated | Cloud Functions only | League standings |
| `public/data/admin_logs/{logId}` | Admins only | Admins create | Immutable audit logs |
| `public/data/shop_items/{itemId}` | All authenticated | Admins only | Shop inventory |

### Top-Level Collections

| Collection | Read Access | Write Access | Notes |
|------------|-------------|--------------|-------|
| `leaderboard/{userId}` | All authenticated | Cloud Functions only | Global leaderboard |
| `artifacts/{appId}/analytics/**` | All authenticated | Cloud Functions only | Analytics data |
| `artifacts/{appId}/admin/**` | Admins only | Cloud Functions only | Admin monitoring data |
| `artifacts/{appId}/config/feature_flags/**` | All read, Admins write logs | Admins only | Feature flags system |
| `artifacts/{appId}/monitoring/**` | Admins only | Cloud Functions only | Error monitoring |
| `artifacts/{appId}/referrals/{referralCode}` | All authenticated | Cloud Functions only | Referral code validation |

## Validation Rules

### Profile Creation
- Must include `uid` matching the authenticated user
- `isAdmin` must be `false` or absent during creation
- Cannot self-promote to admin

### Profile Update
- Users can update their own profile
- Cannot modify `uid` field
- Cannot modify `isAdmin` field unless already admin
- Coins field should only be modified via Cloud Functions (transactions)

### Predictions
- Must include `userId` matching authenticated user
- Users can only create/update their own predictions
- Admins can delete predictions (for moderation)

### Marketplace Listings
- Seller must own the card being listed
- Only seller can cancel active listings
- Only Cloud Functions can mark listings as SOLD
- Listings are never deleted, only cancelled

### Fantasy Lineups
- Must include `user_id` matching authenticated user
- Cannot modify lineups with status `LOCKED`
- Only draft lineups can be deleted

### Chat Messages
- Must include `userId` matching authenticated user
- Must include `pseudo` matching user's profile pseudo
- Must include timestamp
- Messages are immutable (cannot be updated)
- Only admins can delete messages

### Chat Presence
- Can only write to own presence records
- Presence ID must end with user's UID

## Cloud Functions Security

Cloud Functions bypass Firestore security rules and have full access. Ensure proper validation in Cloud Functions:

### Best Practices for Cloud Functions

1. **Validate Authentication**:
```typescript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
}
```

2. **Validate Admin Status**:
```typescript
const profile = await admin.firestore()
  .doc(`artifacts/botola-v1/users/${context.auth.uid}/data/profile`)
  .get();

if (!profile.data()?.isAdmin) {
  throw new functions.https.HttpsError('permission-denied', 'Admin access required');
}
```

3. **Use Transactions for Coin Operations**:
```typescript
await admin.firestore().runTransaction(async (transaction) => {
  const profileRef = admin.firestore()
    .doc(`artifacts/botola-v1/users/${userId}/data/profile`);
  const profile = await transaction.get(profileRef);
  
  transaction.update(profileRef, {
    coins: profile.data().coins + amount
  });
});
```

4. **Log All Admin Actions**:
```typescript
await admin.firestore()
  .collection('artifacts/botola-v1/public/data/admin_logs')
  .add({
    adminId: context.auth.uid,
    adminName: adminProfile.data().pseudo,
    action: 'ACTION_NAME',
    targetId: targetId,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
```

## Testing Security Rules

### Using Firebase Emulator
```bash
firebase emulators:start --only firestore
```

### Testing with Firebase Rules Playground
1. Open Firebase Console → Firestore Database → Rules
2. Click "Rules Playground"
3. Test various scenarios with different authentication states

### Unit Testing Security Rules
Create tests using `@firebase/rules-unit-testing`:

```typescript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('User Profile Security', () => {
  it('should allow users to read their own profile', async () => {
    const db = getFirestore(myAuth);
    await assertSucceeds(
      getDoc(doc(db, 'artifacts/botola-v1/users/user123/data/profile'))
    );
  });
  
  it('should deny users from reading other profiles', async () => {
    const db = getFirestore(myAuth);
    await assertFails(
      getDoc(doc(db, 'artifacts/botola-v1/users/otherUser/data/profile'))
    );
  });
  
  it('should deny users from making themselves admin', async () => {
    const db = getFirestore(myAuth);
    await assertFails(
      setDoc(doc(db, 'artifacts/botola-v1/users/user123/data/profile'), {
        isAdmin: true
      }, { merge: true })
    );
  });
});
```

## Migration Guide

### Migrating from Open Rules

If you're migrating from the previous open rules (`allow read, write: if request.time < timestamp.date(2030, 12, 31)`):

1. **Deploy new rules first** (test in emulator)
2. **Grant admin access** to at least one user via Firebase Console
3. **Update client code** to handle permission errors gracefully
4. **Test all features** with non-admin and admin users
5. **Monitor error logs** for permission issues

### Handling Permission Errors in Client

```typescript
try {
  await updateDoc(doc(db, 'artifacts/botola-v1/users/userId/data/profile'), {
    coins: 1000
  });
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('Permission denied: This operation requires admin access');
    // Show user-friendly error message
  } else {
    throw error;
  }
}
```

## Common Issues & Solutions

### Issue: Admin can't access admin panel
**Solution**: Verify `isAdmin: true` is set in their profile document

### Issue: Users can't place bets
**Solution**: Check that predictions collection rules allow owner write access

### Issue: Marketplace listings fail
**Solution**: Verify user owns the card being listed and listing status is ACTIVE

### Issue: Chat messages fail to send
**Solution**: Ensure message includes userId, pseudo, and timestamp

### Issue: Cloud Function can't update data
**Solution**: Ensure function uses Firebase Admin SDK with proper initialization

## Monitoring & Auditing

### View Admin Logs
```typescript
const logs = await getDocs(
  query(
    collection(db, 'artifacts/botola-v1/public/data/admin_logs'),
    orderBy('timestamp', 'desc'),
    limit(100)
  )
);
```

### View Feature Flag Changes
```typescript
const flagLogs = await getDocs(
  query(
    collection(db, 'artifacts/botola-v1/config/feature_flags/logs'),
    orderBy('timestamp', 'desc'),
    limit(100)
  )
);
```

### Monitor Security Rule Violations
Enable Firestore audit logs in Google Cloud Console to track all rule violations.

## Security Checklist

- [ ] Admin access granted to at least one user
- [ ] Tested admin panel access with admin user
- [ ] Tested admin panel denial with non-admin user
- [ ] Tested user can access own data
- [ ] Tested user cannot access other users' data
- [ ] Tested marketplace listing creation
- [ ] Tested chat message sending
- [ ] Tested Cloud Functions can write to protected collections
- [ ] Tested that users cannot modify coins directly
- [ ] Tested that users cannot self-promote to admin
- [ ] Admin logs are being created for admin actions
- [ ] Monitoring setup for permission errors

## Support

For issues or questions about security rules:
1. Check Firebase Console → Firestore → Rules tab for rule deployment status
2. Check Firebase Console → Firestore → Usage tab for permission errors
3. Review admin logs in `artifacts/botola-v1/public/data/admin_logs`
4. Test in Firebase Emulator before deploying to production

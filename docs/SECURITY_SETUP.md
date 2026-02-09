# Security Rules Setup Guide

Quick guide to deploying the new Firestore security rules and setting up your first admin user.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Authenticated with Firebase (`firebase login`)
- At least one test user account created in your app

## Step 1: Deploy Security Rules

```bash
# From the project root
firebase deploy --only firestore:rules
```

This will deploy the comprehensive role-based access control rules to your Firestore database.

## Step 2: Grant First Admin Access

Since the new rules require admin access to manage other admins, you need to manually grant admin access to your first admin user using the Firebase Console.

### Via Firebase Console (Recommended for First Admin)

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Find your user profile document:
   ```
   artifacts/botola-v1/users/{YOUR_USER_ID}/data/profile
   ```
5. Click on the document to edit it
6. Add a new field:
   - **Field name**: `isAdmin`
   - **Type**: `boolean`
   - **Value**: `true`
7. Click **Update**

### Finding Your User ID

If you don't know your user ID:

1. Go to **Authentication** in Firebase Console
2. Find your user in the list
3. Copy the **User UID**

OR

In your app's browser console:
```javascript
firebase.auth().currentUser.uid
```

## Step 3: Verify Admin Access

1. Reload your BetArena application
2. Add `?admin=true` to the URL (e.g., `http://localhost:5173?admin=true`)
3. You should now see the admin dashboard
4. Navigate to the **"Utilisateurs"** (Users) tab
5. You should see yourself listed as an admin

## Step 4: Grant Additional Admins (Optional)

Now that you have admin access, you can grant admin access to other users through the UI:

1. In the admin panel, go to **"Utilisateurs"** tab
2. Enter the User UID of the person you want to make admin
3. Click **"Accorder l'accès admin"**
4. The user will immediately receive admin access

## Step 5: Deploy Cloud Functions (Optional)

To enable the admin management Cloud Functions:

```bash
# From the project root
cd functions
npm run build
firebase deploy --only functions:grantAdminAccess,functions:revokeAdminAccess,functions:listAdmins,functions:checkAdminStatus
```

## Testing Security Rules

### Test User Access

Create a test user and verify:

✅ User can read their own profile  
✅ User can create predictions  
✅ User can read matches  
✅ User can send chat messages  
❌ User cannot read other users' profiles  
❌ User cannot access admin endpoints  
❌ User cannot modify leaderboard directly  
❌ User cannot make themselves admin  

### Test Admin Access

With your admin user, verify:

✅ Admin can access admin dashboard  
✅ Admin can view all user profiles  
✅ Admin can override match scores  
✅ Admin can manage feature flags  
✅ Admin can grant/revoke admin access  
✅ Admin can view admin logs  

### Test Cloud Functions

Verify that Cloud Functions can still write to protected collections:

✅ Match resolution updates leaderboard  
✅ Pack opening creates cards  
✅ Market purchases transfer ownership  

## Security Checklist

Before going to production, ensure:

- [ ] Security rules deployed to production Firestore
- [ ] At least one admin user configured
- [ ] Tested user access restrictions
- [ ] Tested admin access permissions
- [ ] Cloud Functions deployed and working
- [ ] Admin logs are being created
- [ ] Feature flags are accessible
- [ ] Marketplace transactions work correctly
- [ ] Chat messages can be sent
- [ ] Leaderboard updates work

## Troubleshooting

### "Permission Denied" Errors

If you see permission denied errors:

1. **Check authentication**: Ensure user is logged in
2. **Check admin status**: Verify `isAdmin: true` in user profile
3. **Check rules deployment**: Run `firebase deploy --only firestore:rules`
4. **Check console errors**: Open browser console for detailed error messages
5. **Check Firestore rules**: Go to Firebase Console → Firestore → Rules tab

### Admin Panel Not Accessible

If admin panel shows "Access Denied":

1. Verify `isAdmin: true` in your profile document
2. Clear browser cache and reload
3. Check browser console for errors
4. Verify you're logged in with the correct account

### Cloud Functions Can't Write Data

If Cloud Functions fail with permission errors:

1. Ensure you're using Firebase Admin SDK (not client SDK)
2. Verify Cloud Functions are properly initialized
3. Check Cloud Functions logs: `firebase functions:log`

### Users Can't Place Bets

If users can't create predictions:

1. Verify `userId` matches authenticated user
2. Check that match exists and is not finished
3. Verify user has enough coins
4. Check browser console for detailed errors

## Monitoring

### View Security Rule Activity

In Firebase Console:
1. Go to **Firestore Database**
2. Click on **Usage** tab
3. View read/write operations and permission denials

### View Admin Logs

In Firestore:
```
artifacts/botola-v1/public/data/admin_logs
```

Or in the admin panel:
1. Go to `?admin=true`
2. Navigate to **"Sécurité"** tab
3. View recent admin actions

## Next Steps

1. **Review security rules**: Read [SECURITY_RULES.md](SECURITY_RULES.md) for complete documentation
2. **Configure feature flags**: Set up production feature flags
3. **Test marketplace**: Verify marketplace transactions work correctly
4. **Set up monitoring**: Configure alerting for permission errors
5. **Train admins**: Ensure all admins understand their responsibilities

## Emergency Access Recovery

If you lose admin access and can't recover it:

1. **Using Firebase Console**: Manually set `isAdmin: true` in your profile (see Step 2)
2. **Using Firebase CLI + Admin SDK**: Create a one-time script:

```javascript
// recover-admin.js
const admin = require('firebase-admin');
admin.initializeApp();

const userId = 'YOUR_USER_ID';
admin.firestore()
  .doc(`artifacts/botola-v1/users/${userId}/data/profile`)
  .update({ isAdmin: true })
  .then(() => console.log('✅ Admin access restored'))
  .catch(console.error);
```

Run with:
```bash
node recover-admin.js
```

## Support

For issues or questions:
- Check [SECURITY_RULES.md](SECURITY_RULES.md) for detailed documentation
- Review Firebase Console logs
- Check browser console for client-side errors
- Review Cloud Functions logs for server-side errors

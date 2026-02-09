/**
 * Admin Management Cloud Functions
 * 
 * Provides secure server-side functions for managing admin access and permissions.
 * Only callable by existing admins.
 */

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

const APP_ID = 'botola-v1';

/**
 * Helper function to check if a user is an admin
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const profileDoc = await admin.firestore()
      .doc(`artifacts/${APP_ID}/users/${userId}/data/profile`)
      .get();

    return profileDoc.exists && profileDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Helper function to get user profile
 */
async function getUserProfile(userId: string) {
  const profileDoc = await admin.firestore()
    .doc(`artifacts/${APP_ID}/users/${userId}/data/profile`)
    .get();

  if (!profileDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User profile not found');
  }

  return profileDoc.data();
}

/**
 * Helper function to log admin actions
 */
async function logAdminAction(
  adminId: string,
  adminName: string,
  action: string,
  targetId: string,
  details?: Record<string, any>
) {
  await admin.firestore()
    .collection(`artifacts/${APP_ID}/public/data/admin_logs`)
    .add({
      adminId,
      adminName,
      action,
      targetId,
      details: details || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Grant admin access to a user
 * 
 * @param targetUserId - The user ID to grant admin access to
 * @returns Success status
 * 
 * Security: Only callable by existing admins
 */
export const grantAdminAccess = functions.https.onCall(async (request) => {
  const callerId = request.auth?.uid;

  if (!callerId) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Verify caller is admin
  const callerIsAdmin = await isAdmin(callerId);
  if (!callerIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can grant admin access'
    );
  }

  const { targetUserId } = request.data;

  if (!targetUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUserId is required');
  }

  // Get caller and target profiles
  const callerProfile = await getUserProfile(callerId);
  const targetProfile = await getUserProfile(targetUserId);

  // Check if target is already admin
  if (targetProfile && targetProfile.isAdmin === true) {
    return {
      success: false,
      message: 'User is already an admin',
    };
  }

  // Grant admin access
  await admin.firestore()
    .doc(`artifacts/${APP_ID}/users/${targetUserId}/data/profile`)
    .update({
      isAdmin: true,
      adminGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminGrantedBy: callerId,
    });

  // Log the action
  await logAdminAction(
    callerId,
    callerProfile?.pseudo || 'Unknown Admin',
    'GRANT_ADMIN',
    targetUserId,
    {
      targetPseudo: targetProfile?.pseudo,
    }
  );

  console.log(`Admin access granted to ${targetUserId} by ${callerId}`);

  return {
    success: true,
    message: `Admin access granted to ${targetProfile?.pseudo}`,
  };
});

/**
 * Revoke admin access from a user
 * 
 * @param targetUserId - The user ID to revoke admin access from
 * @returns Success status
 * 
 * Security: Only callable by existing admins
 */
export const revokeAdminAccess = functions.https.onCall(async (request) => {
  const callerId = request.auth?.uid;

  if (!callerId) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Verify caller is admin
  const callerIsAdmin = await isAdmin(callerId);
  if (!callerIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can revoke admin access'
    );
  }

  const { targetUserId } = request.data;

  if (!targetUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUserId is required');
  }

  // Prevent self-revocation
  if (targetUserId === callerId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Cannot revoke your own admin access'
    );
  }

  // Get caller and target profiles
  const callerProfile = await getUserProfile(callerId);
  const targetProfile = await getUserProfile(targetUserId);

  // Check if target is actually admin
  if (targetProfile && targetProfile.isAdmin !== true) {
    return {
      success: false,
      message: 'User is not an admin',
    };
  }

  // Revoke admin access
  await admin.firestore()
    .doc(`artifacts/${APP_ID}/users/${targetUserId}/data/profile`)
    .update({
      isAdmin: false,
      adminRevokedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminRevokedBy: callerId,
    });

  // Log the action
  await logAdminAction(
    callerId,
    callerProfile?.pseudo || 'Unknown Admin',
    'REVOKE_ADMIN',
    targetUserId,
    {
      targetPseudo: targetProfile?.pseudo,
    }
  );

  console.log(`Admin access revoked from ${targetUserId} by ${callerId}`);

  return {
    success: true,
    message: `Admin access revoked from ${targetProfile?.pseudo}`,
  };
});

/**
 * List all admin users
 * 
 * @returns List of admin users
 * 
 * Security: Only callable by existing admins
 */
export const listAdmins = functions.https.onCall(async (request) => {
  const callerId = request.auth?.uid;

  if (!callerId) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Verify caller is admin
  const callerIsAdmin = await isAdmin(callerId);
  if (!callerIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can list admin users'
    );
  }

  // Query all users with isAdmin: true
  const usersSnapshot = await admin.firestore()
    .collectionGroup('profile')
    .where('isAdmin', '==', true)
    .get();

  const admins = usersSnapshot.docs.map(doc => ({
    uid: doc.data().uid,
    pseudo: doc.data().pseudo,
    level: doc.data().level,
    adminGrantedAt: doc.data().adminGrantedAt,
    adminGrantedBy: doc.data().adminGrantedBy,
  }));

  return {
    admins,
    count: admins.length,
  };
});

/**
 * Check if a user is an admin (callable from client)
 * 
 * @param userId - The user ID to check (optional, defaults to caller)
 * @returns Admin status
 * 
 * Security: Anyone can check any user's admin status (public information)
 */
export const checkAdminStatus = functions.https.onCall(async (request) => {
  const callerId = request.auth?.uid;

  if (!callerId) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { userId } = request.data;
  const targetUserId = userId || callerId;

  const isUserAdmin = await isAdmin(targetUserId);

  return {
    userId: targetUserId,
    isAdmin: isUserAdmin,
  };
});

/**
 * Validate marketplace transaction
 * Helper for marketplace operations
 */
export async function validateMarketplaceTransaction(
  sellerId: string,
  buyerId: string,
  cardId: string,
  price: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Verify seller owns the card
    const cardDoc = await admin.firestore()
      .doc(`artifacts/${APP_ID}/users/${sellerId}/cards/${cardId}`)
      .get();

    if (!cardDoc.exists) {
      return { valid: false, error: 'Card not found' };
    }

    if (cardDoc.data()?.owner_id !== sellerId) {
      return { valid: false, error: 'Seller does not own the card' };
    }

    if (cardDoc.data()?.is_locked) {
      return { valid: false, error: 'Card is locked' };
    }

    // Verify buyer has enough coins
    const buyerProfile = await getUserProfile(buyerId);
    if (!buyerProfile || (buyerProfile.coins || 0) < price) {
      return { valid: false, error: 'Insufficient coins' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating marketplace transaction:', error);
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Validate user can modify resource
 * Generic helper for ownership validation
 */
export async function validateUserOwnership(
  userId: string,
  resourcePath: string
): Promise<boolean> {
  try {
    const resourceDoc = await admin.firestore().doc(resourcePath).get();

    if (!resourceDoc.exists) {
      return false;
    }

    const data = resourceDoc.data();
    return (
      data?.userId === userId ||
      data?.user_id === userId ||
      data?.owner_id === userId ||
      resourcePath.includes(`/users/${userId}/`)
    );
  } catch (error) {
    console.error('Error validating user ownership:', error);
    return false;
  }
}

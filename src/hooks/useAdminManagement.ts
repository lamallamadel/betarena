import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface AdminUser {
  uid: string;
  pseudo: string;
  level: number;
  adminGrantedAt?: { seconds: number };
  adminGrantedBy?: string;
}

interface AdminManagementResult {
  success: boolean;
  message?: string;
}

interface ListAdminsResult {
  admins: AdminUser[];
  count: number;
}

interface CheckAdminResult {
  userId: string;
  isAdmin: boolean;
}

/**
 * Hook for managing admin access via Cloud Functions
 * 
 * Provides secure methods to grant/revoke admin access and list admins.
 * All operations require the caller to be an admin.
 */
export const useAdminManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Grant admin access to a user
   * 
   * @param targetUserId - The user ID to grant admin access to
   * @returns Promise with success status and message
   */
  const grantAdmin = async (targetUserId: string): Promise<AdminManagementResult> => {
    setLoading(true);
    setError(null);

    try {
      const grantAdminAccess = httpsCallable<{ targetUserId: string }, AdminManagementResult>(
        functions,
        'grantAdminAccess'
      );

      const result = await grantAdminAccess({ targetUserId });
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grant admin access';
      setError(errorMessage);
      console.error('Error granting admin access:', err);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Revoke admin access from a user
   * 
   * @param targetUserId - The user ID to revoke admin access from
   * @returns Promise with success status and message
   */
  const revokeAdmin = async (targetUserId: string): Promise<AdminManagementResult> => {
    setLoading(true);
    setError(null);

    try {
      const revokeAdminAccess = httpsCallable<{ targetUserId: string }, AdminManagementResult>(
        functions,
        'revokeAdminAccess'
      );

      const result = await revokeAdminAccess({ targetUserId });
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke admin access';
      setError(errorMessage);
      console.error('Error revoking admin access:', err);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * List all admin users
   * 
   * @returns Promise with list of admin users
   */
  const listAdmins = async (): Promise<AdminUser[]> => {
    setLoading(true);
    setError(null);

    try {
      const listAdminsFn = httpsCallable<Record<string, never>, ListAdminsResult>(
        functions,
        'listAdmins'
      );

      const result = await listAdminsFn({});
      return result.data.admins;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list admins';
      setError(errorMessage);
      console.error('Error listing admins:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if a user is an admin
   * 
   * @param userId - The user ID to check (optional, defaults to current user)
   * @returns Promise with admin status
   */
  const checkAdminStatus = async (userId?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const checkAdminFn = httpsCallable<{ userId?: string }, CheckAdminResult>(
        functions,
        'checkAdminStatus'
      );

      const result = await checkAdminFn({ userId });
      return result.data.isAdmin;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check admin status';
      setError(errorMessage);
      console.error('Error checking admin status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    grantAdmin,
    revokeAdmin,
    listAdmins,
    checkAdminStatus,
    loading,
    error,
  };
};

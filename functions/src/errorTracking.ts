import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const db = admin.firestore();
const APP_ID = "botola-v1";

export enum MarketplaceErrorType {
  DUPLICATE_PURCHASE = "DUPLICATE_PURCHASE",
  TRANSACTION_ROLLBACK = "TRANSACTION_ROLLBACK",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  LISTING_NOT_FOUND = "LISTING_NOT_FOUND",
  LISTING_INACTIVE = "LISTING_INACTIVE",
  CARD_NOT_FOUND = "CARD_NOT_FOUND",
  CARD_LOCKED = "CARD_LOCKED",
  PACK_OUT_OF_STOCK = "PACK_OUT_OF_STOCK",
  SELF_PURCHASE = "SELF_PURCHASE",
  UNAUTHORIZED = "UNAUTHORIZED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  INVALID_ARGUMENT = "INVALID_ARGUMENT",
}

export enum MarketplaceFunctionType {
  BUY_PACK = "buyPack",
  LIST_CARD = "listCard",
  CANCEL_LISTING = "cancelListing",
  BUY_MARKET_LISTING = "buyMarketListing",
}

export interface MarketplaceErrorContext {
  functionName: MarketplaceFunctionType;
  userId?: string;
  errorType: MarketplaceErrorType;
  errorMessage: string;
  timestamp: number;
  metadata?: {
    packId?: string;
    cardId?: string;
    listingId?: string;
    sellerId?: string;
    buyerId?: string;
    price?: number;
    userBalance?: number;
    transactionId?: string;
    duplicateAttempts?: number;
    stackTrace?: string;
    [key: string]: any;
  };
}

export interface TransactionRollbackLog {
  functionName: MarketplaceFunctionType;
  userId: string;
  transactionId: string;
  rollbackReason: string;
  timestamp: number;
  partialState?: {
    balanceDeducted?: boolean;
    stockDecremented?: boolean;
    cardTransferred?: boolean;
    listingUpdated?: boolean;
    cardLocked?: boolean;
    cardUnlocked?: boolean;
    listingCancelled?: boolean;
  };
  metadata?: Record<string, any>;
}

export interface DuplicatePurchaseAttempt {
  userId: string;
  functionName: MarketplaceFunctionType;
  targetId: string; // packId or listingId
  attemptCount: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
}

/**
 * Logs a marketplace error to Firestore for tracking and alerting
 */
export async function logMarketplaceError(context: MarketplaceErrorContext): Promise<void> {
  try {
    const errorRef = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("monitoring")
      .doc("marketplace_errors")
      .collection("errors");

    await errorRef.add({
      ...context,
      id: errorRef.doc().id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log critical errors with structured logging for Cloud Logging
    if (isCriticalError(context.errorType)) {
      logger.error("CRITICAL_MARKETPLACE_ERROR", {
        ...context,
        severity: "CRITICAL",
      });
    } else {
      logger.warn("MARKETPLACE_ERROR", context);
    }

    // Check if we should trigger an alert
    await checkAndTriggerAlert(context);
  } catch (error) {
    // Fallback to console logging if Firestore write fails
    logger.error("Failed to log marketplace error to Firestore", {
      originalError: context,
      loggingError: error,
    });
  }
}

/**
 * Logs a transaction rollback event
 */
export async function logTransactionRollback(log: TransactionRollbackLog): Promise<void> {
  try {
    const rollbackRef = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("monitoring")
      .doc("marketplace_errors")
      .collection("rollbacks");

    await rollbackRef.add({
      ...log,
      id: rollbackRef.doc().id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.warn("TRANSACTION_ROLLBACK", log);

    // Update rollback counter for alerting
    await incrementRollbackCounter(log.functionName);
  } catch (error) {
    logger.error("Failed to log transaction rollback", {
      originalLog: log,
      loggingError: error,
    });
  }
}

/**
 * Detects and prevents duplicate purchase attempts
 */
export async function detectDuplicatePurchase(
  userId: string,
  functionName: MarketplaceFunctionType,
  targetId: string
): Promise<{ isDuplicate: boolean; shouldBlock: boolean }> {
  try {
    const duplicateRef = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("monitoring")
      .doc("marketplace_errors")
      .collection("duplicate_attempts")
      .doc(`${userId}_${functionName}_${targetId}`);

    const now = Date.now();
    const DUPLICATE_WINDOW_MS = 5000; // 5 seconds
    const MAX_ATTEMPTS_BEFORE_BLOCK = 3;

    const result = await db.runTransaction(async (t) => {
      const doc = await t.get(duplicateRef);

      if (!doc.exists) {
        // First attempt
        const attempt: DuplicatePurchaseAttempt = {
          userId,
          functionName,
          targetId,
          attemptCount: 1,
          firstAttempt: now,
          lastAttempt: now,
          blocked: false,
        };
        t.set(duplicateRef, attempt);
        return { isDuplicate: false, shouldBlock: false };
      }

      const data = doc.data() as DuplicatePurchaseAttempt;
      const timeSinceFirst = now - data.firstAttempt;

      // Reset if outside duplicate window
      if (timeSinceFirst > DUPLICATE_WINDOW_MS) {
        const attempt: DuplicatePurchaseAttempt = {
          userId,
          functionName,
          targetId,
          attemptCount: 1,
          firstAttempt: now,
          lastAttempt: now,
          blocked: false,
        };
        t.set(duplicateRef, attempt);
        return { isDuplicate: false, shouldBlock: false };
      }

      // Within duplicate window
      const newAttemptCount = data.attemptCount + 1;
      const shouldBlock = newAttemptCount >= MAX_ATTEMPTS_BEFORE_BLOCK;

      t.update(duplicateRef, {
        attemptCount: newAttemptCount,
        lastAttempt: now,
        blocked: shouldBlock,
      });

      logger.warn("DUPLICATE_PURCHASE_DETECTED", {
        userId,
        functionName,
        targetId,
        attemptCount: newAttemptCount,
        shouldBlock,
      });

      return { isDuplicate: true, shouldBlock };
    });

    return result;
  } catch (error) {
    logger.error("Failed to check duplicate purchase", { userId, functionName, targetId, error });
    // On error, allow the purchase but log the issue
    return { isDuplicate: false, shouldBlock: false };
  }
}

/**
 * Clears duplicate purchase tracking after successful transaction
 */
export async function clearDuplicatePurchaseTracking(
  userId: string,
  functionName: MarketplaceFunctionType,
  targetId: string
): Promise<void> {
  try {
    const duplicateRef = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("monitoring")
      .doc("marketplace_errors")
      .collection("duplicate_attempts")
      .doc(`${userId}_${functionName}_${targetId}`);

    await duplicateRef.delete();
  } catch (error) {
    logger.warn("Failed to clear duplicate purchase tracking", {
      userId,
      functionName,
      targetId,
      error,
    });
  }
}

/**
 * Gets error statistics for a specific function
 */
export async function getErrorStats(
  functionName: MarketplaceFunctionType,
  hoursBack: number = 24
): Promise<{
  totalErrors: number;
  errorsByType: Record<string, number>;
  criticalErrors: number;
}> {
  try {
    const startTime = Date.now() - hoursBack * 60 * 60 * 1000;

    const errorsSnapshot = await db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("monitoring")
      .doc("marketplace_errors")
      .collection("errors")
      .where("functionName", "==", functionName)
      .where("timestamp", ">=", startTime)
      .get();

    const errorsByType: Record<string, number> = {};
    let criticalErrors = 0;

    errorsSnapshot.forEach((doc) => {
      const data = doc.data();
      const errorType = data.errorType as string;

      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;

      if (isCriticalError(data.errorType as MarketplaceErrorType)) {
        criticalErrors++;
      }
    });

    return {
      totalErrors: errorsSnapshot.size,
      errorsByType,
      criticalErrors,
    };
  } catch (error) {
    logger.error("Failed to get error stats", { functionName, error });
    return { totalErrors: 0, errorsByType: {}, criticalErrors: 0 };
  }
}

/**
 * Determines if an error type is critical and requires immediate attention
 */
function isCriticalError(errorType: MarketplaceErrorType): boolean {
  const criticalTypes = [
    MarketplaceErrorType.DUPLICATE_PURCHASE,
    MarketplaceErrorType.TRANSACTION_ROLLBACK,
    MarketplaceErrorType.INTERNAL_ERROR,
  ];
  return criticalTypes.includes(errorType);
}

/**
 * Checks if error threshold is exceeded and triggers alert
 */
async function checkAndTriggerAlert(context: MarketplaceErrorContext): Promise<void> {
  try {
    const stats = await getErrorStats(context.functionName, 1); // Last hour

    const ERROR_THRESHOLD = 10;
    const CRITICAL_ERROR_THRESHOLD = 3;

    if (stats.criticalErrors >= CRITICAL_ERROR_THRESHOLD) {
      await triggerAlert({
        severity: "CRITICAL",
        message: `Critical error threshold exceeded for ${context.functionName}`,
        stats,
        latestError: context,
      });
    } else if (stats.totalErrors >= ERROR_THRESHOLD) {
      await triggerAlert({
        severity: "WARNING",
        message: `Error threshold exceeded for ${context.functionName}`,
        stats,
        latestError: context,
      });
    }
  } catch (error) {
    logger.error("Failed to check alert thresholds", { context, error });
  }
}

/**
 * Triggers an alert (logs to structured logging for monitoring tools)
 */
async function triggerAlert(alert: {
  severity: "WARNING" | "CRITICAL";
  message: string;
  stats: any;
  latestError: MarketplaceErrorContext;
}): Promise<void> {
  try {
    // Store alert in Firestore
    const alertRef = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("monitoring")
      .doc("marketplace_errors")
      .collection("alerts");

    await alertRef.add({
      ...alert,
      timestamp: Date.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log with appropriate severity for Cloud Logging/Monitoring
    if (alert.severity === "CRITICAL") {
      logger.error("MARKETPLACE_ALERT", alert);
    } else {
      logger.warn("MARKETPLACE_ALERT", alert);
    }
  } catch (error) {
    logger.error("Failed to trigger alert", { alert, error });
  }
}

/**
 * Increments rollback counter for monitoring
 */
async function incrementRollbackCounter(functionName: MarketplaceFunctionType): Promise<void> {
  try {
    const counterRef = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("monitoring")
      .doc("marketplace_errors")
      .collection("counters")
      .doc(functionName);

    await counterRef.set(
      {
        rollbackCount: admin.firestore.FieldValue.increment(1),
        lastRollback: Date.now(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    logger.error("Failed to increment rollback counter", { functionName, error });
  }
}

/**
 * Creates a comprehensive error context from an error object
 */
export function createErrorContext(
  functionName: MarketplaceFunctionType,
  errorType: MarketplaceErrorType,
  error: any,
  metadata?: Record<string, any>
): MarketplaceErrorContext {
  return {
    functionName,
    errorType,
    errorMessage: error?.message || String(error),
    timestamp: Date.now(),
    metadata: {
      ...metadata,
      stackTrace: error?.stack || undefined,
    },
  };
}

/**
 * HTTP Callable function to get marketplace error statistics (admin only)
 */
import { onCall, HttpsError } from "firebase-functions/https";

export const getMarketplaceErrorStats = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { functionName, hoursBack = 24 } = request.data;

  if (!functionName) {
    throw new HttpsError("invalid-argument", "functionName is required.");
  }

  try {
    const stats = await getErrorStats(functionName as MarketplaceFunctionType, hoursBack);
    
    // Also get rollback count
    const counterRef = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("monitoring")
      .doc("marketplace_errors")
      .collection("counters")
      .doc(functionName);

    const counterDoc = await counterRef.get();
    const rollbackCount = counterDoc.exists ? counterDoc.data()?.rollbackCount || 0 : 0;

    return {
      ...stats,
      rollbackCount,
      timeRange: `${hoursBack} hours`,
    };
  } catch (error) {
    logger.error("Error getting marketplace error stats", { error, functionName });
    throw new HttpsError("internal", "Failed to retrieve error statistics.");
  }
});

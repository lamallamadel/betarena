import { getFunctions, httpsCallable } from "firebase/functions";

export enum MarketplaceOperation {
  BUY_PACK = "buyPack",
  LIST_CARD = "listCard",
  CANCEL_LISTING = "cancelListing",
  BUY_MARKET_LISTING = "buyMarketListing",
}

export interface MarketplaceErrorLog {
  operation: MarketplaceOperation;
  userId?: string;
  errorCode?: string;
  errorMessage: string;
  timestamp: number;
  metadata?: {
    packId?: string;
    cardId?: string;
    listingId?: string;
    price?: number;
    retryCount?: number;
    [key: string]: any;
  };
}

/**
 * Logs a marketplace error locally (console + optional analytics)
 */
export function logMarketplaceError(error: MarketplaceErrorLog): void {
  console.error("[Marketplace Error]", {
    ...error,
    timestamp: new Date(error.timestamp).toISOString(),
  });

  // If Firebase Analytics is available, log to analytics
  try {
    // Dynamic import to avoid errors if analytics isn't initialized
    import("../config/firebase").then(({ analytics }) => {
      if (analytics) {
        import("firebase/analytics").then(({ logEvent }) => {
          logEvent(analytics, "marketplace_error", {
            operation: error.operation,
            error_code: error.errorCode || "unknown",
            error_message: error.errorMessage.substring(0, 100), // Truncate for analytics
          });
        });
      }
    });
  } catch {
    // Silently fail if analytics not available
  }
}

/**
 * Wraps a marketplace operation with error tracking and retry logic
 */
export async function withErrorTracking<T>(
  operation: MarketplaceOperation,
  userId: string | undefined,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  let retryCount = 0;
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 1000;

  while (retryCount <= MAX_RETRIES) {
    try {
      const result = await fn();
      
      // Log success metrics
      if (retryCount > 0) {
        console.info(`[Marketplace] ${operation} succeeded after ${retryCount} retries`);
      }

      return result;
    } catch (error: any) {
      const errorLog: MarketplaceErrorLog = {
        operation,
        userId,
        errorCode: error.code || error.name || "unknown",
        errorMessage: error.message || String(error),
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          retryCount,
          duration: Date.now() - startTime,
        },
      };

      // Don't retry certain errors
      const nonRetryableErrors = [
        "unauthenticated",
        "permission-denied",
        "invalid-argument",
        "not-found",
        "resource-exhausted", // Duplicate purchase blocks
      ];

      const shouldRetry = retryCount < MAX_RETRIES && 
        !nonRetryableErrors.includes(error.code || "");

      if (!shouldRetry) {
        logMarketplaceError(errorLog);
        throw error;
      }

      retryCount++;
      console.warn(`[Marketplace] ${operation} failed, retrying (${retryCount}/${MAX_RETRIES})...`);

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retryCount));
    }
  }

  throw new Error("Max retries exceeded");
}

/**
 * Detects if an error is due to network issues
 */
export function isNetworkError(error: any): boolean {
  const networkErrorMessages = [
    "network",
    "offline",
    "timeout",
    "connection",
    "fetch",
  ];

  const errorString = String(error?.message || error).toLowerCase();
  return networkErrorMessages.some(msg => errorString.includes(msg));
}

/**
 * Formats error messages for user display (French)
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === "string") return error;

  const message = error?.message || String(error);
  const code = error?.code;

  // Map common Firebase error codes to French messages
  const errorMap: Record<string, string> = {
    "unauthenticated": "Vous devez être connecté pour effectuer cette action",
    "permission-denied": "Vous n'avez pas la permission d'effectuer cette action",
    "not-found": "Élément introuvable",
    "invalid-argument": "Données invalides",
    "failed-precondition": "Conditions non remplies pour cette action",
    "resource-exhausted": "Trop de tentatives. Veuillez réessayer dans quelques instants",
    "already-exists": "Cet élément existe déjà",
    "aborted": "Opération annulée",
    "internal": "Erreur interne du serveur",
    "unavailable": "Service temporairement indisponible",
    "deadline-exceeded": "Délai d'attente dépassé",
  };

  // Return mapped message if available
  if (code && errorMap[code]) {
    return errorMap[code];
  }

  // Check for specific marketplace errors
  if (message.includes("Insufficient")) {
    return "Solde insuffisant pour effectuer cette action";
  }
  if (message.includes("out of stock")) {
    return "Pack en rupture de stock";
  }
  if (message.includes("locked")) {
    return "Cette carte est déjà verrouillée";
  }
  if (message.includes("active")) {
    return "Cette annonce n'est plus active";
  }
  if (message.includes("own listing")) {
    return "Vous ne pouvez pas acheter votre propre annonce";
  }

  // Network errors
  if (isNetworkError(error)) {
    return "Erreur de connexion. Vérifiez votre connexion Internet";
  }

  // Default fallback
  return "Une erreur est survenue. Veuillez réessayer";
}

/**
 * Gets error statistics from the backend (admin only)
 */
export async function getMarketplaceErrorStats(
  functionName: string,
  hoursBack: number = 24
): Promise<{
  totalErrors: number;
  errorsByType: Record<string, number>;
  criticalErrors: number;
}> {
  try {
    const functions = getFunctions();
    const getStatsFn = httpsCallable(functions, "getMarketplaceErrorStats");
    const result = await getStatsFn({ functionName, hoursBack });
    return result.data as any;
  } catch (error) {
    console.error("Failed to fetch error stats:", error);
    return { totalErrors: 0, errorsByType: {}, criticalErrors: 0 };
  }
}

import { onCall, HttpsError } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {
    logMarketplaceError,
    logTransactionRollback,
    detectDuplicatePurchase,
    clearDuplicatePurchaseTracking,
    createErrorContext,
    MarketplaceErrorType,
    MarketplaceFunctionType,
} from "./errorTracking";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = "botola-v1";
const MARKET_TAX_RATE = 0.10; // RG-L02

/**
 * Rec 3: Marketplace Purchase Backend
 * Handles atomic listing status check, balance check, and transfers.
 */
export const buyMarketListing = onCall(async (request) => {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    if (!request.auth) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.BUY_MARKET_LISTING,
            errorType: MarketplaceErrorType.UNAUTHORIZED,
            errorMessage: "User must be logged in",
            timestamp: Date.now(),
            metadata: { transactionId },
        });
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { listingId } = request.data;
    if (!listingId) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.BUY_MARKET_LISTING,
            userId: request.auth.uid,
            errorType: MarketplaceErrorType.INVALID_ARGUMENT,
            errorMessage: "listingId is required",
            timestamp: Date.now(),
            metadata: { transactionId },
        });
        throw new HttpsError("invalid-argument", "listingId is required.");
    }

    const buyerId = request.auth.uid;

    // Check for duplicate purchase attempts
    const duplicateCheck = await detectDuplicatePurchase(
        buyerId,
        MarketplaceFunctionType.BUY_MARKET_LISTING,
        listingId
    );

    if (duplicateCheck.shouldBlock) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.BUY_MARKET_LISTING,
            userId: buyerId,
            errorType: MarketplaceErrorType.DUPLICATE_PURCHASE,
            errorMessage: "Duplicate purchase attempt blocked",
            timestamp: Date.now(),
            metadata: {
                transactionId,
                listingId,
                duplicateAttempts: 3,
            },
        });
        throw new HttpsError("resource-exhausted", "Trop de tentatives d'achat. Veuillez réessayer dans quelques instants.");
    }

    const listingRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("market_listings").doc(listingId);
    const buyerRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(buyerId).collection("data").doc("profile");

    const partialState = {
        balanceDeducted: false,
        cardTransferred: false,
        listingUpdated: false,
    };

    try {
        const result = await db.runTransaction(async (t: admin.firestore.Transaction) => {
            // 1. Get Listing
            const listingSnap = await t.get(listingRef);
            if (!listingSnap.exists) {
                throw new HttpsError("not-found", "Listing not found.");
            }

            const listing = listingSnap.data()!;
            if (listing.status !== "ACTIVE") {
                throw new HttpsError("failed-precondition", "Listing is no longer active.");
            }

            const price = listing.price;
            const sellerId = listing.seller_id;
            const cardId = listing.card_id;

            if (sellerId === buyerId) {
                throw new HttpsError("failed-precondition", "You cannot buy your own listing.");
            }

            // 2. Get Buyer balance
            const buyerSnap = await t.get(buyerRef);
            if (!buyerSnap.exists) {
                throw new HttpsError("not-found", "Buyer profile not found.");
            }

            const buyerData = buyerSnap.data()!;
            const buyerCoins = buyerData.coins || 0;

            if (buyerCoins < price) {
                throw new HttpsError("failed-precondition", "Insufficient coins.");
            }

            // 3. Get Seller & Card refs
            const sellerRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(sellerId).collection("data").doc("profile");
            const cardRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(sellerId).collection("cards").doc(cardId);
            const buyerCardRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(buyerId).collection("cards").doc(cardId);

            // 4. Calculations (RG-L02)
            const netSeller = Math.floor(price * (1 - MARKET_TAX_RATE));

            // 5. Execute Transfers
            // Update Buyer wallet
            t.update(buyerRef, { coins: admin.firestore.FieldValue.increment(-price) });
            partialState.balanceDeducted = true;

            // Update Seller wallet
            t.update(sellerRef, { coins: admin.firestore.FieldValue.increment(netSeller) });

            // Update Listing status
            t.update(listingRef, {
                status: "SOLD",
                buyer_id: buyerId,
                sold_at: Date.now()
            });
            partialState.listingUpdated = true;

            // Transfer Card: Delete from seller, set to buyer
            const cardSnap = await t.get(cardRef);
            const cardData = cardSnap.exists ? cardSnap.data()! : listing.card;

            t.delete(cardRef);
            t.set(buyerCardRef, {
                ...cardData,
                is_locked: false, // Unlock for the new owner
                owner_id: buyerId,
                updated_at: Date.now()
            });
            partialState.cardTransferred = true;

            return { success: true, price, netSeller, cardId };
        });

        // Clear duplicate tracking on success
        await clearDuplicatePurchaseTracking(
            buyerId,
            MarketplaceFunctionType.BUY_MARKET_LISTING,
            listingId
        );

        logger.info("buyMarketListing success", {
            buyerId,
            listingId,
            transactionId,
            duration: Date.now() - startTime,
        });

        return result;

    } catch (error) {
        // Determine error type
        let errorType = MarketplaceErrorType.INTERNAL_ERROR;
        if (error instanceof HttpsError) {
            switch (error.code) {
                case "not-found":
                    errorType = MarketplaceErrorType.LISTING_NOT_FOUND;
                    break;
                case "failed-precondition":
                    if (error.message.includes("Insufficient")) {
                        errorType = MarketplaceErrorType.INSUFFICIENT_BALANCE;
                    } else if (error.message.includes("active")) {
                        errorType = MarketplaceErrorType.LISTING_INACTIVE;
                    } else if (error.message.includes("own listing")) {
                        errorType = MarketplaceErrorType.SELF_PURCHASE;
                    }
                    break;
            }
        }

        // Log transaction rollback if any state was modified
        if (partialState.balanceDeducted || partialState.listingUpdated || partialState.cardTransferred) {
            await logTransactionRollback({
                functionName: MarketplaceFunctionType.BUY_MARKET_LISTING,
                userId: buyerId,
                transactionId,
                rollbackReason: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                partialState,
                metadata: { listingId },
            });
        }

        // Log marketplace error
        await logMarketplaceError(
            createErrorContext(
                MarketplaceFunctionType.BUY_MARKET_LISTING,
                errorType,
                error,
                {
                    buyerId,
                    listingId,
                    transactionId,
                    duration: Date.now() - startTime,
                }
            )
        );

        logger.error("Error in buyMarketListing", { buyerId, listingId, transactionId, error });

        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error during purchase.");
    }
});

/**
 * listCard: Mise en vente d'une carte sur le marché P2P
 */
export const listCard = onCall(async (request) => {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    if (!request.auth) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.LIST_CARD,
            errorType: MarketplaceErrorType.UNAUTHORIZED,
            errorMessage: "User must be logged in",
            timestamp: Date.now(),
            metadata: { transactionId },
        });
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { cardId, price } = request.data;
    if (!cardId || !price || price <= 0) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.LIST_CARD,
            userId: request.auth.uid,
            errorType: MarketplaceErrorType.INVALID_ARGUMENT,
            errorMessage: "cardId and a positive price are required",
            timestamp: Date.now(),
            metadata: { transactionId, cardId, price },
        });
        throw new HttpsError("invalid-argument", "cardId and a positive price are required.");
    }

    const sellerId = request.auth.uid;
    const cardRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(sellerId).collection("cards").doc(cardId);
    const listingsRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("market_listings");
    const profileRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(sellerId).collection("data").doc("profile");

    const partialState = {
        cardLocked: false,
        listingCreated: false,
    };

    try {
        const result = await db.runTransaction(async (t) => {
            const cardSnap = await t.get(cardRef);
            if (!cardSnap.exists) {
                throw new HttpsError("not-found", "Card not found in your inventory.");
            }

            const card = cardSnap.data()!;
            if (card.is_locked) {
                throw new HttpsError("failed-precondition", "Card is already locked (already on sale or in a lineup).");
            }

            const profileSnap = await t.get(profileRef);
            const sellerPseudo = profileSnap.exists ? profileSnap.data()?.pseudo || "Anonyme" : "Anonyme";

            // 1. Lock the card
            t.update(cardRef, { is_locked: true });
            partialState.cardLocked = true;

            // 2. Create the listing
            const newListingRef = listingsRef.doc();
            const netSeller = Math.floor(price * (1 - MARKET_TAX_RATE));

            t.set(newListingRef, {
                id: newListingRef.id,
                card_id: cardId,
                card: card, // Dénormalisé pour l'affichage
                seller_id: sellerId,
                seller_pseudo: sellerPseudo,
                price: price,
                net_seller: netSeller,
                status: "ACTIVE",
                created_at: Date.now()
            });
            partialState.listingCreated = true;

            return { success: true, listingId: newListingRef.id };
        });

        logger.info("listCard success", {
            sellerId,
            cardId,
            transactionId,
            duration: Date.now() - startTime,
        });

        return result;

    } catch (error) {
        // Determine error type
        let errorType = MarketplaceErrorType.INTERNAL_ERROR;
        if (error instanceof HttpsError) {
            switch (error.code) {
                case "not-found":
                    errorType = MarketplaceErrorType.CARD_NOT_FOUND;
                    break;
                case "failed-precondition":
                    if (error.message.includes("locked")) {
                        errorType = MarketplaceErrorType.CARD_LOCKED;
                    }
                    break;
            }
        }

        // Log transaction rollback if card was locked
        if (partialState.cardLocked || partialState.listingCreated) {
            await logTransactionRollback({
                functionName: MarketplaceFunctionType.LIST_CARD,
                userId: sellerId,
                transactionId,
                rollbackReason: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                partialState,
                metadata: { cardId, price },
            });
        }

        // Log marketplace error
        await logMarketplaceError(
            createErrorContext(
                MarketplaceFunctionType.LIST_CARD,
                errorType,
                error,
                {
                    sellerId,
                    cardId,
                    price,
                    transactionId,
                    duration: Date.now() - startTime,
                }
            )
        );

        logger.error("Error in listCard", { sellerId, cardId, transactionId, error });

        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error during listing.");
    }
});

/**
 * cancelListing: Retirer une carte de la vente
 */
export const cancelListing = onCall(async (request) => {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    if (!request.auth) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.CANCEL_LISTING,
            errorType: MarketplaceErrorType.UNAUTHORIZED,
            errorMessage: "User must be logged in",
            timestamp: Date.now(),
            metadata: { transactionId },
        });
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { listingId } = request.data;
    if (!listingId) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.CANCEL_LISTING,
            userId: request.auth.uid,
            errorType: MarketplaceErrorType.INVALID_ARGUMENT,
            errorMessage: "listingId is required",
            timestamp: Date.now(),
            metadata: { transactionId },
        });
        throw new HttpsError("invalid-argument", "listingId is required.");
    }

    const sellerId = request.auth.uid;
    const listingRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("market_listings").doc(listingId);

    const partialState = {
        cardUnlocked: false,
        listingCancelled: false,
    };

    try {
        const result = await db.runTransaction(async (t) => {
            const listingSnap = await t.get(listingRef);
            if (!listingSnap.exists) {
                throw new HttpsError("not-found", "Listing not found.");
            }

            const listing = listingSnap.data()!;
            if (listing.seller_id !== sellerId) {
                throw new HttpsError("permission-denied", "You are not the seller of this listing.");
            }

            if (listing.status !== "ACTIVE") {
                throw new HttpsError("failed-precondition", "Listing is not active.");
            }

            const cardRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(sellerId).collection("cards").doc(listing.card_id);

            // 1. Unlock the card
            t.update(cardRef, { is_locked: false });
            partialState.cardUnlocked = true;

            // 2. Cancel the listing
            t.update(listingRef, { status: "CANCELLED", updated_at: Date.now() });
            partialState.listingCancelled = true;

            return { success: true };
        });

        logger.info("cancelListing success", {
            sellerId,
            listingId,
            transactionId,
            duration: Date.now() - startTime,
        });

        return result;

    } catch (error) {
        // Determine error type
        let errorType = MarketplaceErrorType.INTERNAL_ERROR;
        if (error instanceof HttpsError) {
            switch (error.code) {
                case "not-found":
                    errorType = MarketplaceErrorType.LISTING_NOT_FOUND;
                    break;
                case "failed-precondition":
                    errorType = MarketplaceErrorType.LISTING_INACTIVE;
                    break;
                case "permission-denied":
                    errorType = MarketplaceErrorType.UNAUTHORIZED;
                    break;
            }
        }

        // Log transaction rollback if any state was modified
        if (partialState.cardUnlocked || partialState.listingCancelled) {
            await logTransactionRollback({
                functionName: MarketplaceFunctionType.CANCEL_LISTING,
                userId: sellerId,
                transactionId,
                rollbackReason: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                partialState,
                metadata: { listingId },
            });
        }

        // Log marketplace error
        await logMarketplaceError(
            createErrorContext(
                MarketplaceFunctionType.CANCEL_LISTING,
                errorType,
                error,
                {
                    sellerId,
                    listingId,
                    transactionId,
                    duration: Date.now() - startTime,
                }
            )
        );

        logger.error("Error in cancelListing", { sellerId, listingId, transactionId, error });

        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error during cancellation.");
    }
});

/**
 * buyPack: Achat d'un pack de cartes (Marché Primaire)
 */
export const buyPack = onCall(async (request) => {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    if (!request.auth) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.BUY_PACK,
            errorType: MarketplaceErrorType.UNAUTHORIZED,
            errorMessage: "User must be logged in",
            timestamp: Date.now(),
            metadata: { transactionId },
        });
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { packId } = request.data;
    if (!packId) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.BUY_PACK,
            userId: request.auth.uid,
            errorType: MarketplaceErrorType.INVALID_ARGUMENT,
            errorMessage: "packId is required",
            timestamp: Date.now(),
            metadata: { transactionId },
        });
        throw new HttpsError("invalid-argument", "packId is required.");
    }

    const userId = request.auth.uid;

    // Check for duplicate purchase attempts
    const duplicateCheck = await detectDuplicatePurchase(
        userId,
        MarketplaceFunctionType.BUY_PACK,
        packId
    );

    if (duplicateCheck.shouldBlock) {
        await logMarketplaceError({
            functionName: MarketplaceFunctionType.BUY_PACK,
            userId,
            errorType: MarketplaceErrorType.DUPLICATE_PURCHASE,
            errorMessage: "Duplicate purchase attempt blocked",
            timestamp: Date.now(),
            metadata: {
                transactionId,
                packId,
                duplicateAttempts: 3,
            },
        });
        throw new HttpsError("resource-exhausted", "Trop de tentatives d'achat. Veuillez réessayer dans quelques instants.");
    }

    const packRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("packs").doc(packId);
    const profileRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("data").doc("profile");
    const userCardsRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("cards");

    const partialState = {
        balanceDeducted: false,
        stockDecremented: false,
        cardsGenerated: false,
    };

    try {
        const result = await db.runTransaction(async (t) => {
            // 1. Get Pack info
            const packSnap = await t.get(packRef);
            if (!packSnap.exists) {
                throw new HttpsError("not-found", "Pack not found.");
            }

            const pack = packSnap.data()!;
            if (pack.stock <= 0) {
                throw new HttpsError("failed-precondition", "Pack out of stock.");
            }

            // 2. Check User balance
            const profileSnap = await t.get(profileRef);
            if (!profileSnap.exists) {
                throw new HttpsError("not-found", "User profile not found.");
            }

            const coins = profileSnap.data()?.coins || 0;
            if (coins < pack.price) {
                throw new HttpsError("failed-precondition", "Insufficient coins.");
            }

            // 3. Deduct coins and decrement stock
            t.update(profileRef, { coins: admin.firestore.FieldValue.increment(-pack.price) });
            partialState.balanceDeducted = true;

            t.update(packRef, { stock: admin.firestore.FieldValue.increment(-1) });
            partialState.stockDecremented = true;

            // 4. Generate Cards (RNG)
            // Note: In a production environment, we should fetch random players from DB
            // For now, we'll fetch a small sample of player references to pick from
            const playerRefsSnap = await db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("player_references").limit(100).get();
            const playerRefs = playerRefsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            if (playerRefs.length === 0) {
                throw new HttpsError("failed-precondition", "No player references found to generate cards.");
            }

            const generatedCards = [];
            for (const item of pack.contents) {
                // item = { scarcity: 'RARE', count: 2 }
                for (let i = 0; i < item.count; i++) {
                    // Pick a random player reference (simple random for now)
                    const randomPlayer: any = playerRefs[Math.floor(Math.random() * playerRefs.length)];

                    const cardData = {
                        player_reference_id: randomPlayer.id,
                        player: randomPlayer,
                        owner_id: userId,
                        scarcity: item.scarcity,
                        serial_number: Math.floor(Math.random() * 100) + 1, // Mock serial
                        max_supply: 100,
                        is_locked: false,
                        instance_id: pack.instance_id || 1,
                        created_at: Date.now()
                    };

                    const newCardRef = userCardsRef.doc();
                    t.set(newCardRef, cardData);
                    generatedCards.push({ id: newCardRef.id, ...cardData });
                }
            }
            partialState.cardsGenerated = true;

            return { success: true, cards: generatedCards };
        });

        // Clear duplicate tracking on success
        await clearDuplicatePurchaseTracking(
            userId,
            MarketplaceFunctionType.BUY_PACK,
            packId
        );

        logger.info("buyPack success", {
            userId,
            packId,
            transactionId,
            cardsGenerated: result.cards.length,
            duration: Date.now() - startTime,
        });

        return result;

    } catch (error) {
        // Determine error type
        let errorType = MarketplaceErrorType.INTERNAL_ERROR;
        if (error instanceof HttpsError) {
            switch (error.code) {
                case "not-found":
                    errorType = MarketplaceErrorType.LISTING_NOT_FOUND;
                    break;
                case "failed-precondition":
                    if (error.message.includes("Insufficient")) {
                        errorType = MarketplaceErrorType.INSUFFICIENT_BALANCE;
                    } else if (error.message.includes("stock")) {
                        errorType = MarketplaceErrorType.PACK_OUT_OF_STOCK;
                    }
                    break;
            }
        }

        // Log transaction rollback if any state was modified
        if (partialState.balanceDeducted || partialState.stockDecremented || partialState.cardsGenerated) {
            await logTransactionRollback({
                functionName: MarketplaceFunctionType.BUY_PACK,
                userId,
                transactionId,
                rollbackReason: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                partialState,
                metadata: { packId },
            });
        }

        // Log marketplace error
        await logMarketplaceError(
            createErrorContext(
                MarketplaceFunctionType.BUY_PACK,
                errorType,
                error,
                {
                    userId,
                    packId,
                    transactionId,
                    duration: Date.now() - startTime,
                }
            )
        );

        logger.error("Error in buyPack", { userId, packId, transactionId, error });

        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error during pack purchase.");
    }
});

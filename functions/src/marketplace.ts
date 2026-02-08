import { onCall, HttpsError } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

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
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { listingId } = request.data;
    if (!listingId) {
        throw new HttpsError("invalid-argument", "listingId is required.");
    }

    const buyerId = request.auth.uid;
    const listingRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("market_listings").doc(listingId);
    const buyerRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(buyerId).collection("data").doc("profile");

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

            // Update Seller wallet
            t.update(sellerRef, { coins: admin.firestore.FieldValue.increment(netSeller) });

            // Update Listing status
            t.update(listingRef, {
                status: "SOLD",
                buyer_id: buyerId,
                sold_at: Date.now()
            });

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

            return { success: true, price, netSeller, cardId };
        });

        return result;

    } catch (error) {
        logger.error("Error in buyMarketListing", { buyerId, listingId, error });
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error during purchase.");
    }
});

/**
 * listCard: Mise en vente d'une carte sur le marché P2P
 */
export const listCard = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { cardId, price } = request.data;
    if (!cardId || !price || price <= 0) {
        throw new HttpsError("invalid-argument", "cardId and a positive price are required.");
    }

    const sellerId = request.auth.uid;
    const cardRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(sellerId).collection("cards").doc(cardId);
    const listingsRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("market_listings");
    const profileRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(sellerId).collection("data").doc("profile");

    try {
        return await db.runTransaction(async (t) => {
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

            return { success: true, listingId: newListingRef.id };
        });
    } catch (error) {
        logger.error("Error in listCard", { sellerId, cardId, error });
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error during listing.");
    }
});

/**
 * cancelListing: Retirer une carte de la vente
 */
export const cancelListing = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { listingId } = request.data;
    if (!listingId) {
        throw new HttpsError("invalid-argument", "listingId is required.");
    }

    const sellerId = request.auth.uid;
    const listingRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("market_listings").doc(listingId);

    try {
        return await db.runTransaction(async (t) => {
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

            // 2. Cancel the listing
            t.update(listingRef, { status: "CANCELLED", updated_at: Date.now() });

            return { success: true };
        });
    } catch (error) {
        logger.error("Error in cancelListing", { sellerId, listingId, error });
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error during cancellation.");
    }
});

/**
 * buyPack: Achat d'un pack de cartes (Marché Primaire)
 */
export const buyPack = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { packId } = request.data;
    if (!packId) {
        throw new HttpsError("invalid-argument", "packId is required.");
    }

    const userId = request.auth.uid;
    const packRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("packs").doc(packId);
    const profileRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("data").doc("profile");
    const userCardsRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("cards");

    try {
        return await db.runTransaction(async (t) => {
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
            t.update(packRef, { stock: admin.firestore.FieldValue.increment(-1) });

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

            return { success: true, cards: generatedCards };
        });
    } catch (error) {
        logger.error("Error in buyPack", { userId, packId, error });
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Internal server error during pack purchase.");
    }
});

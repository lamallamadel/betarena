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

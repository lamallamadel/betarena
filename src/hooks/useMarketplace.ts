import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, APP_ID } from '../config/firebase';
import {
  withErrorTracking,
  formatErrorMessage,
  MarketplaceOperation,
} from '../utils/errorTracking';
import type { Card, Pack, MarketListing, PriceHistory, CardScarcity, PlayerPosition } from '../types/types';

interface MarketplaceFilters {
  position?: PlayerPosition;
  scarcity?: CardScarcity;
}

export const useMarketplace = (userId: string | undefined) => {
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Listeners ---

  useEffect(() => {
    if (!userId) {
      setMyCards([]);
      return;
    }

    const cardsRef = collection(db, 'artifacts', APP_ID, 'users', userId, 'cards');
    const unsub = onSnapshot(cardsRef, (snapshot) => {
      const cards: Card[] = [];
      snapshot.forEach((docSnap) => {
        cards.push({ id: docSnap.id, ...docSnap.data() } as Card);
      });
      setMyCards(cards);
      setLoading(false);
    }, (error) => {
      console.error('Erreur chargement cartes:', error);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  useEffect(() => {
    const packsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'packs');
    const unsub = onSnapshot(packsRef, (snapshot) => {
      const packList: Pack[] = [];
      snapshot.forEach((docSnap) => {
        packList.push({ id: docSnap.id, ...docSnap.data() } as Pack);
      });
      setPacks(packList);
    }, (error) => {
      console.error('Erreur chargement packs:', error);
    });

    return () => unsub();
  }, []);

  const fetchListings = useCallback((filters?: MarketplaceFilters) => {
    const listingsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'market_listings');
    const q = query(listingsRef, where('status', '==', 'ACTIVE'), orderBy('created_at', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      let listingList: MarketListing[] = [];
      snapshot.forEach((docSnap) => {
        listingList.push({ id: docSnap.id, ...docSnap.data() } as MarketListing);
      });

      if (filters?.position) {
        listingList = listingList.filter((l) => l.card.player.position === filters.position);
      }
      if (filters?.scarcity) {
        listingList = listingList.filter((l) => l.card.scarcity === filters.scarcity);
      }

      setListings(listingList);
    }, (error) => {
      console.error('Erreur chargement annonces:', error);
    });

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = fetchListings();
    return () => unsub();
  }, [fetchListings]);

  // --- Actions with Error Tracking ---
  const functions = getFunctions();

  const buyPack = async (packId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');

    try {
      await withErrorTracking(
        MarketplaceOperation.BUY_PACK,
        userId,
        async () => {
          const buyPackFn = httpsCallable(functions, 'buyPack');
          await buyPackFn({ packId });
        },
        { packId }
      );
    } catch (err: any) {
      const userMessage = formatErrorMessage(err);
      throw new Error(userMessage);
    }
  };

  const listCard = async (cardId: string, price: number): Promise<void> => {
    if (!userId) throw new Error('Non connecté');

    try {
      await withErrorTracking(
        MarketplaceOperation.LIST_CARD,
        userId,
        async () => {
          const listCardFn = httpsCallable(functions, 'listCard');
          await listCardFn({ cardId, price });
        },
        { cardId, price }
      );
    } catch (err: any) {
      const userMessage = formatErrorMessage(err);
      throw new Error(userMessage);
    }
  };

  const cancelListing = async (listingId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');

    try {
      await withErrorTracking(
        MarketplaceOperation.CANCEL_LISTING,
        userId,
        async () => {
          const cancelListingFn = httpsCallable(functions, 'cancelListing');
          await cancelListingFn({ listingId });
        },
        { listingId }
      );
    } catch (err: any) {
      const userMessage = formatErrorMessage(err);
      throw new Error(userMessage);
    }
  };

  /**
   * buyListing : Acheter une carte sur le marché P2P via Cloud Function (Rec 3)
   */
  const buyListing = async (listingId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');

    try {
      await withErrorTracking(
        MarketplaceOperation.BUY_MARKET_LISTING,
        userId,
        async () => {
          const buyListingFn = httpsCallable(functions, 'buyMarketListing');
          await buyListingFn({ listingId });
        },
        { listingId }
      );
    } catch (err: any) {
      const userMessage = formatErrorMessage(err);
      throw new Error(userMessage);
    }
  };

  const fetchPriceHistory = async (playerRefId: string): Promise<void> => {
    try {
      const entriesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'price_history', playerRefId, 'entries');
      const q = query(entriesRef, orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const entries: PriceHistory[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as PriceHistory);
      });
      setPriceHistory(entries);
    } catch (error) {
      console.error('Erreur chargement historique prix:', error);
      setPriceHistory([]);
    }
  };

  return {
    myCards,
    packs,
    listings,
    priceHistory,
    loading,
    buyPack,
    listCard,
    cancelListing,
    buyListing,
    fetchPriceHistory,
    fetchListings,
  };
};

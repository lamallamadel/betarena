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

  // --- Actions ---
  const functions = getFunctions();

  const buyPack = async (packId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');
    const buyPackFn = httpsCallable(functions, 'buyPack');
    try {
      await buyPackFn({ packId });
    } catch (err: any) {
      console.error('Erreur achat pack:', err);
      throw new Error(err.message || 'Échec de l\'achat');
    }
  };

  const listCard = async (cardId: string, price: number): Promise<void> => {
    if (!userId) throw new Error('Non connecté');
    const listCardFn = httpsCallable(functions, 'listCard');
    try {
      await listCardFn({ cardId, price });
    } catch (err: any) {
      console.error('Erreur mise en vente:', err);
      throw new Error(err.message || 'Échec de la mise en vente');
    }
  };

  const cancelListing = async (listingId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');
    const cancelListingFn = httpsCallable(functions, 'cancelListing');
    try {
      await cancelListingFn({ listingId });
    } catch (err: any) {
      console.error('Erreur annulation vente:', err);
      throw new Error(err.message || 'Échec de l\'annulation');
    }
  };

  /**
   * buyListing : Acheter une carte sur le marché P2P via Cloud Function (Rec 3)
   */
  const buyListing = async (listingId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');

    const functions = getFunctions();
    const buyListingFn = httpsCallable(functions, 'buyMarketListing');

    try {
      await buyListingFn({ listingId });
    } catch (err: any) {
      console.error('Erreur achat marché:', err);
      throw new Error(err.message || 'Échec de l\'achat');
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

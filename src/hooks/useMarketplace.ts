import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  runTransaction,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { Card, Pack, MarketListing, PriceHistory, CardScarcity, PlayerPosition } from '../types/types';

// RG-L02 : Taxe de 10% sur les ventes P2P (burn)
const MARKET_TAX_RATE = 0.10;

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

  // fetchMyCards : onSnapshot sur la collection de cartes de l'utilisateur
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

  // fetchPacks : onSnapshot sur les packs disponibles
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

  // fetchListings : onSnapshot sur les annonces actives avec filtres client-side
  const fetchListings = useCallback((filters?: MarketplaceFilters) => {
    const listingsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'market_listings');
    const q = query(listingsRef, where('status', '==', 'ACTIVE'), orderBy('created_at', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      let listingList: MarketListing[] = [];
      snapshot.forEach((docSnap) => {
        listingList.push({ id: docSnap.id, ...docSnap.data() } as MarketListing);
      });

      // Filtres client-side
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

  // Listener par défaut pour les listings (sans filtres)
  useEffect(() => {
    const unsub = fetchListings();
    return () => unsub();
  }, [fetchListings]);

  // --- Actions ---

  /**
   * buyPack : Acheter un pack
   * Transaction atomique : vérification stock > 0, débit coins, décrémentation stock,
   * génération RNG des cartes selon le contenu du pack, ajout aux cartes de l'utilisateur
   */
  const buyPack = async (packId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');

    const packRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'packs', packId);
    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');

    await runTransaction(db, async (t) => {
      const packDoc = await t.get(packRef);
      const userDoc = await t.get(userRef);

      if (!packDoc.exists()) throw new Error('Pack introuvable');
      if (!userDoc.exists()) throw new Error('Profil introuvable');

      const packData = packDoc.data() as Pack;
      const userData = userDoc.data();

      if (packData.stock <= 0) throw new Error('Stock épuisé');
      if ((userData.coins || 0) < packData.price) throw new Error('Solde insuffisant');

      // Débit coins utilisateur
      t.update(userRef, { coins: (userData.coins || 0) - packData.price });

      // Décrémentation stock
      t.update(packRef, { stock: packData.stock - 1 });

      // Génération des cartes selon les contenus du pack (RNG)
      const playerPool = await getPlayerPool();

      for (const content of packData.contents) {
        for (let i = 0; i < content.count; i++) {
          // Sélectionner un joueur aléatoire du pool
          const randomPlayer = playerPool[Math.floor(Math.random() * playerPool.length)];
          if (!randomPlayer) continue;

          const cardId = `${randomPlayer.id}_${content.scarcity}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          const maxSupply = getMaxSupplyForScarcity(content.scarcity);
          const serialNumber = Math.floor(Math.random() * maxSupply) + 1;

          const newCard: Omit<Card, 'id'> = {
            player_reference_id: randomPlayer.id,
            player: randomPlayer,
            owner_id: userId,
            scarcity: content.scarcity,
            serial_number: serialNumber,
            max_supply: maxSupply,
            is_locked: false,
            instance_id: Date.now() + i,
          };

          const cardRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'cards', cardId);
          t.set(cardRef, newCard);
        }
      }
    });
  };

  /**
   * listCard : Mettre une carte en vente sur le marché P2P
   * Transaction : vérification carte non verrouillée, verrouillage, création annonce
   * Net vendeur = price * (1 - MARKET_TAX_RATE)
   */
  const listCard = async (cardId: string, price: number): Promise<void> => {
    if (!userId) throw new Error('Non connecté');
    if (price <= 0) throw new Error('Prix invalide');

    const cardRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'cards', cardId);
    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');

    await runTransaction(db, async (t) => {
      const cardDoc = await t.get(cardRef);
      const userDoc = await t.get(userRef);

      if (!cardDoc.exists()) throw new Error('Carte introuvable');
      if (!userDoc.exists()) throw new Error('Profil introuvable');

      const cardData = cardDoc.data() as Card;
      const userData = userDoc.data();

      if (cardData.is_locked) throw new Error('Carte déjà verrouillée');

      const netSeller = Math.floor(price * (1 - MARKET_TAX_RATE));

      // Verrouiller la carte
      t.update(cardRef, { is_locked: true });

      // Créer l'annonce
      const listingId = `listing_${cardId}_${Date.now()}`;
      const listingRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'market_listings', listingId);
      t.set(listingRef, {
        card_id: cardId,
        card: { id: cardId, ...cardData },
        seller_id: userId,
        seller_pseudo: userData.pseudo || userData.username || 'Anonyme',
        price,
        net_seller: netSeller,
        status: 'ACTIVE',
        created_at: Date.now(),
      });
    });
  };

  /**
   * cancelListing : Annuler une annonce
   * Transaction : vérification propriétaire, statut CANCELLED, déverrouillage carte
   */
  const cancelListing = async (listingId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');

    const listingRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'market_listings', listingId);

    await runTransaction(db, async (t) => {
      const listingDoc = await t.get(listingRef);

      if (!listingDoc.exists()) throw new Error('Annonce introuvable');

      const listingData = listingDoc.data() as MarketListing;

      if (listingData.seller_id !== userId) throw new Error('Vous ne pouvez annuler que vos propres annonces');
      if (listingData.status !== 'ACTIVE') throw new Error('Annonce déjà finalisée');

      // Annuler l'annonce
      t.update(listingRef, { status: 'CANCELLED' });

      // Déverrouiller la carte
      const cardRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'cards', listingData.card_id);
      t.update(cardRef, { is_locked: false });
    });
  };

  /**
   * buyListing : Acheter une carte sur le marché P2P
   * Transaction : vérification annonce ACTIVE, solde acheteur >= prix,
   * débit acheteur, crédit vendeur (prix * 0.9), transfert carte, statut SOLD
   */
  const buyListing = async (listingId: string): Promise<void> => {
    if (!userId) throw new Error('Non connecté');

    const listingRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'market_listings', listingId);

    await runTransaction(db, async (t) => {
      const listingDoc = await t.get(listingRef);

      if (!listingDoc.exists()) throw new Error('Annonce introuvable');

      const listingData = listingDoc.data() as MarketListing;

      if (listingData.status !== 'ACTIVE') throw new Error('Annonce plus disponible');
      if (listingData.seller_id === userId) throw new Error('Vous ne pouvez pas acheter votre propre carte');

      // Vérifier solde acheteur
      const buyerRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');
      const buyerDoc = await t.get(buyerRef);

      if (!buyerDoc.exists()) throw new Error('Profil acheteur introuvable');

      const buyerData = buyerDoc.data();
      if ((buyerData.coins || 0) < listingData.price) throw new Error('Solde insuffisant');

      // Vérifier vendeur
      const sellerRef = doc(db, 'artifacts', APP_ID, 'users', listingData.seller_id, 'data', 'profile');
      const sellerDoc = await t.get(sellerRef);

      if (!sellerDoc.exists()) throw new Error('Profil vendeur introuvable');

      const sellerData = sellerDoc.data();
      const netSeller = Math.floor(listingData.price * (1 - MARKET_TAX_RATE));

      // 1. Débiter l'acheteur
      t.update(buyerRef, { coins: (buyerData.coins || 0) - listingData.price });

      // 2. Créditer le vendeur (prix - taxe 10%)
      t.update(sellerRef, { coins: (sellerData.coins || 0) + netSeller });

      // 3. Supprimer la carte du vendeur
      const sellerCardRef = doc(db, 'artifacts', APP_ID, 'users', listingData.seller_id, 'cards', listingData.card_id);
      t.delete(sellerCardRef);

      // 4. Ajouter la carte à l'acheteur
      const buyerCardRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'cards', listingData.card_id);
      t.set(buyerCardRef, {
        ...listingData.card,
        owner_id: userId,
        is_locked: false,
      });

      // 5. Marquer l'annonce comme vendue
      t.update(listingRef, { status: 'SOLD' });
    });
  };

  /**
   * fetchPriceHistory : Récupérer l'historique des prix pour un joueur
   */
  const fetchPriceHistory = async (playerRefId: string): Promise<void> => {
    try {
      const entriesRef = collection(
        db,
        'artifacts',
        APP_ID,
        'public',
        'data',
        'price_history',
        playerRefId,
        'entries'
      );
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

  // --- Helpers ---

  /**
   * Récupère le pool de joueurs disponibles pour la génération de cartes
   * Fallback vers un pool fictif si la collection n'existe pas encore
   */
  const getPlayerPool = async () => {
    try {
      const playersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'players');
      const snapshot = await getDocs(playersRef);
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      }
    } catch (e) {
      console.error('Erreur récupération joueurs:', e);
    }

    // Pool par défaut (Botola Pro)
    return [
      { id: 'pl_001', name: 'Ayoub El Kaabi', club: 'Olympique de Safi', position: 'FWD' as const, base_value: 500 },
      { id: 'pl_002', name: 'Yahya Jabrane', club: 'Wydad AC', position: 'MID' as const, base_value: 600 },
      { id: 'pl_003', name: 'Achraf Hakimi', club: 'PSG', position: 'DEF' as const, base_value: 2000 },
      { id: 'pl_004', name: 'Yassine Bounou', club: 'Al-Hilal', position: 'GK' as const, base_value: 1500 },
      { id: 'pl_005', name: 'Soufiane Rahimi', club: 'Al Ain', position: 'FWD' as const, base_value: 800 },
      { id: 'pl_006', name: 'Azzedine Ounahi', club: 'OM', position: 'MID' as const, base_value: 900 },
      { id: 'pl_007', name: 'Nayef Aguerd', club: 'Sevilla FC', position: 'DEF' as const, base_value: 1200 },
      { id: 'pl_008', name: 'Munir El Haddadi', club: 'Getafe CF', position: 'FWD' as const, base_value: 700 },
    ];
  };

  /** RG-L03: Nombre maximum de tirages selon la rareté */
  const getMaxSupplyForScarcity = (scarcity: CardScarcity): number => {
    switch (scarcity) {
      case 'LEGENDARY': return 1;    // 1 copie unique
      case 'EPIC': return 10;        // 10 copies max
      case 'RARE': return 100;       // 100 copies max
      case 'COMMON': return Infinity; // Illimité (achat Banque permanent)
      default: return Infinity;
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

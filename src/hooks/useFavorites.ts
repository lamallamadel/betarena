import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export type FavoriteEntityType = 'TEAM' | 'LEAGUE' | 'MATCH';

interface Favorites {
    teams: string[];
    leagues: string[];
    matches: string[];
}

interface UseFavoritesReturn {
    favorites: Favorites;
    isFavorite: (entityType: FavoriteEntityType, entityId: string) => boolean;
    toggleFavorite: (entityType: FavoriteEntityType, entityId: string) => boolean;
    getFavoriteCount: () => number;
}

/**
 * Hook pour gérer les favoris (équipes, ligues, matchs)
 * RG-J04: Stockage server-side Firestore lié au user_id
 * Pas de stockage local pour les invités — action bloquante
 */
export const useFavorites = (): UseFavoritesReturn => {
    const { user } = useAuth();

    const [favorites, setFavorites] = useState<Favorites>({
        teams: [], leagues: [], matches: []
    });

    // Listen to Firestore favorites in real-time
    useEffect(() => {
        if (!user?.uid) {
            setFavorites({ teams: [], leagues: [], matches: [] });
            return;
        }

        const favRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'favorites');
        const unsub = onSnapshot(favRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setFavorites({
                    teams: data.teams || [],
                    leagues: data.leagues || [],
                    matches: data.matches || [],
                });
            } else {
                setFavorites({ teams: [], leagues: [], matches: [] });
            }
        });

        return () => unsub();
    }, [user?.uid]);

    const getKey = (entityType: FavoriteEntityType): 'teams' | 'leagues' | 'matches' => {
        return entityType === 'TEAM' ? 'teams' : entityType === 'LEAGUE' ? 'leagues' : 'matches';
    };

    // Check if entity is favorite
    const isFavorite = useCallback((entityType: FavoriteEntityType, entityId: string): boolean => {
        const key = getKey(entityType);
        return favorites[key].includes(entityId);
    }, [favorites]);

    // Toggle favorite — returns true if user is logged in (action allowed)
    const toggleFavorite = useCallback((entityType: FavoriteEntityType, entityId: string): boolean => {
        if (!user?.uid) {
            return false; // Guest wall
        }

        const key = getKey(entityType);
        const favRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'favorites');
        const isCurrentlyFav = favorites[key].includes(entityId);

        // Optimistic update
        setFavorites(prev => ({
            ...prev,
            [key]: isCurrentlyFav
                ? prev[key].filter(id => id !== entityId)
                : [...prev[key], entityId]
        }));

        // Persist to Firestore
        const update = isCurrentlyFav
            ? { [key]: arrayRemove(entityId) }
            : { [key]: arrayUnion(entityId) };

        updateDoc(favRef, update).catch((err) => {
            // If doc doesn't exist yet, create it
            if (err.code === 'not-found') {
                const { setDoc } = require('firebase/firestore');
                setDoc(favRef, { teams: [], leagues: [], matches: [], [key]: [entityId] });
            }
        });

        return true;
    }, [user?.uid, favorites]);

    // Get total favorite count
    const getFavoriteCount = useCallback((): number => {
        return favorites.teams.length + favorites.leagues.length + favorites.matches.length;
    }, [favorites]);

    return {
        favorites,
        isFavorite,
        toggleFavorite,
        getFavoriteCount
    };
};

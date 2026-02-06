import { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEY = 'betarena_favorites';

/**
 * Hook pour gérer les favoris (équipes, ligues, matchs)
 * RG-J: Persistence localStorage + sync Firestore si connecté
 */
export const useFavorites = (): UseFavoritesReturn => {
    const { user } = useAuth();

    // Initialize from localStorage
    const [favorites, setFavorites] = useState<Favorites>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('[useFavorites] Error loading from localStorage:', e);
        }
        return { teams: [], leagues: [], matches: [] };
    });

    // Persist to localStorage on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }, [favorites]);

    // Check if entity is favorite
    const isFavorite = useCallback((entityType: FavoriteEntityType, entityId: string): boolean => {
        switch (entityType) {
            case 'TEAM': return favorites.teams.includes(entityId);
            case 'LEAGUE': return favorites.leagues.includes(entityId);
            case 'MATCH': return favorites.matches.includes(entityId);
            default: return false;
        }
    }, [favorites]);

    // Toggle favorite - returns true if user is logged in (action allowed)
    const toggleFavorite = useCallback((entityType: FavoriteEntityType, entityId: string): boolean => {
        // Check if user is logged in
        if (!user) {
            // Return false to indicate guest wall should be shown
            return false;
        }

        setFavorites(prev => {
            const key = entityType === 'TEAM' ? 'teams' : entityType === 'LEAGUE' ? 'leagues' : 'matches';
            const current = prev[key];

            if (current.includes(entityId)) {
                // Remove from favorites
                return {
                    ...prev,
                    [key]: current.filter(id => id !== entityId)
                };
            } else {
                // Add to favorites
                return {
                    ...prev,
                    [key]: [...current, entityId]
                };
            }
        });

        return true;
    }, [user]);

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

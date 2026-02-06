import React, { useState } from 'react';
import { useFavorites, type FavoriteEntityType } from '../../hooks/useFavorites';

interface FavoriteButtonProps {
    entityType: FavoriteEntityType;
    entityId: string;
    size?: 'sm' | 'md' | 'lg';
    onGuestBlock?: () => void;
}

/**
 * Bouton étoile pour toggle favori
 * Affiche animation et gère le guest wall
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    entityType,
    entityId,
    size = 'md',
    onGuestBlock
}) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const [isAnimating, setIsAnimating] = useState(false);

    const isFav = isFavorite(entityType, entityId);

    const sizeClasses = {
        sm: 'w-7 h-7',
        md: 'w-9 h-9',
        lg: 'w-11 h-11'
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const allowed = toggleFavorite(entityType, entityId);

        if (!allowed) {
            // User is guest - show guest wall
            onGuestBlock?.();
            return;
        }

        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <button
            onClick={handleClick}
            className={`
                ${sizeClasses[size]} 
                flex items-center justify-center rounded-full 
                transition-all duration-200 active:scale-90
                border-2
                ${isFav
                    ? 'bg-yellow-500 border-yellow-400'
                    : 'bg-slate-700 border-slate-600 hover:border-yellow-500'
                }
                ${isAnimating ? 'scale-125' : ''}
            `}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
            <span className={`text-sm ${isFav ? '' : 'opacity-80'}`}>
                {isFav ? '⭐' : '☆'}
            </span>
        </button>
    );
};


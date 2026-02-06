import React, { useState } from 'react';
import { Star } from 'lucide-react';
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
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10'
    };

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 22
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
                ${isFav
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-slate-800 text-slate-500 hover:text-yellow-400'
                }
                ${isAnimating ? 'scale-125' : ''}
            `}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
            <Star
                size={iconSizes[size]}
                className={`transition-all duration-200 ${isFav ? 'fill-yellow-400' : ''}`}
            />
        </button>
    );
};

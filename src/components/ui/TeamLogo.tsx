import React from 'react';

interface TeamLogoProps {
    src: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeMap = {
    sm: 'w-6 h-6 text-lg',
    md: 'w-8 h-8 text-2xl',
    lg: 'w-10 h-10 text-3xl',
    xl: 'w-14 h-14 text-4xl',
};

/**
 * Renders a team logo — handles both emoji strings (mock data)
 * and image URLs (API-Football real data).
 */
export const TeamLogo: React.FC<TeamLogoProps> = ({ src, alt = '', size = 'md', className = '' }) => {
    const isUrl = src?.startsWith('http');

    if (isUrl) {
        return (
            <img
                src={src}
                alt={alt}
                className={`${sizeMap[size].split(' ').slice(0, 2).join(' ')} object-contain ${className}`}
                loading="lazy"
            />
        );
    }

    return (
        <span className={`${sizeMap[size].split(' ').pop()} leading-none ${className}`}>
            {src}
        </span>
    );
};

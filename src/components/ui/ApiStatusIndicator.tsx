import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOfflineMode } from '../../hooks/useOfflineMode';

interface ApiStatusIndicatorProps {
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Simple API status indicator component.
 * Shows a green/red icon based on API health.
 * 
 * @example
 * ```tsx
 * // Icon only
 * <ApiStatusIndicator />
 * 
 * // With text
 * <ApiStatusIndicator showText />
 * 
 * // Large size
 * <ApiStatusIndicator size="lg" showText />
 * ```
 */
export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ 
    showText = false, 
    size = 'sm' 
}) => {
    const { isOnline, consecutiveFailures } = useOfflineMode();

    const getSizeClass = () => {
        switch (size) {
            case 'lg': return 20;
            case 'md': return 16;
            default: return 12;
        }
    };

    const iconSize = getSizeClass();

    if (isOnline && consecutiveFailures === 0) {
        return (
            <div className="flex items-center gap-1.5">
                <Wifi size={iconSize} className="text-emerald-500" />
                {showText && <span className="text-xs text-emerald-500 font-bold">En ligne</span>}
            </div>
        );
    }

    if (consecutiveFailures > 0 && consecutiveFailures < 3) {
        return (
            <div className="flex items-center gap-1.5">
                <Wifi size={iconSize} className="text-yellow-500 animate-pulse" />
                {showText && <span className="text-xs text-yellow-500 font-bold">Ralenti</span>}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <WifiOff size={iconSize} className="text-red-500" />
            {showText && <span className="text-xs text-red-500 font-bold">Hors ligne</span>}
        </div>
    );
};

import React from 'react';
import { WifiOff, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import type { DataStaleness, ApiHealthStatus } from '../../types/types';

interface OfflineBannerProps {
    apiHealth: ApiHealthStatus;
    staleness?: DataStaleness;
    onRetry?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
    apiHealth, 
    staleness,
    onRetry 
}) => {
    const [now, setNow] = React.useState(() => Date.now());

    React.useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    if (!staleness || staleness.severity === 'ok') {
        return null;
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'warning':
                return 'bg-yellow-900/90 border-yellow-500/50 text-yellow-200';
            case 'stale':
                return 'bg-orange-900/90 border-orange-500/50 text-orange-200';
            case 'critical':
                return 'bg-red-900/90 border-red-500/50 text-red-200';
            default:
                return 'bg-slate-900/90 border-slate-700 text-slate-300';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'warning':
                return <Clock size={16} className="text-yellow-400" />;
            case 'stale':
                return <AlertTriangle size={16} className="text-orange-400" />;
            case 'critical':
                return <WifiOff size={16} className="text-red-400" />;
            default:
                return <Clock size={16} className="text-slate-400" />;
        }
    };

    const getTimeMessage = () => {
        if (!staleness.minutesSinceUpdate) return staleness.message;
        
        const minutes = staleness.minutesSinceUpdate;
        if (minutes < 60) {
            return `Dernière mise à jour il y a ${Math.round(minutes)} min`;
        }
        const hours = Math.floor(minutes / 60);
        return `Dernière mise à jour il y a ${hours}h`;
    };

    return (
        <div className={`fixed top-16 left-0 right-0 z-40 mx-auto max-w-md px-4 animate-slide-down`}>
            <div className={`${getSeverityColor(staleness.severity)} border rounded-2xl px-4 py-3 backdrop-blur-md shadow-lg flex items-center gap-3`}>
                <div className="shrink-0">
                    {getSeverityIcon(staleness.severity)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-tight">
                        {apiHealth.isOnline 
                            ? getTimeMessage()
                            : 'Hors ligne - Données en cache'
                        }
                    </p>
                    {staleness.message && staleness.message !== getTimeMessage() && (
                        <p className="text-[10px] opacity-80 mt-0.5">
                            {staleness.message}
                        </p>
                    )}
                    {!apiHealth.isOnline && apiHealth.estimatedRecoveryTime && (
                        <p className="text-[10px] opacity-80 mt-0.5">
                            Nouvelle tentative dans {Math.ceil((apiHealth.estimatedRecoveryTime - now) / 60000)} min
                        </p>
                    )}
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                        title="Réessayer maintenant"
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

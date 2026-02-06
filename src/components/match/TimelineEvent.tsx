import React from 'react';
import type { MatchEvent } from '../../hooks/useMatchLive';
import { RefreshCcw } from 'lucide-react'; // Mock icons

interface TimelineEventProps {
    event: MatchEvent;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({ event }) => {
    const isHome = event.team === 'home';
    const isSystem = event.team === 'system';

    let alignClass = isHome ? 'items-start text-left' : 'items-end text-right';
    if (isSystem) alignClass = 'items-center text-center w-full mx-auto';

    // Styles VAR Cancelled
    const containerStyle = event.is_cancelled ? 'opacity-50' : '';
    const textStyle = event.is_cancelled ? 'line-through decoration-red-500' : '';

    const getIcon = () => {
        switch (event.type) {
            case 'GOAL': return <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">⚽</div>;
            case 'CARD_YELLOW': return <div className="w-5 h-6 bg-yellow-400 rounded-sm border border-slate-700 shadow-sm" />;
            case 'CARD_RED': return <div className="w-5 h-6 bg-red-600 rounded-sm border border-slate-700 shadow-sm" />;
            case 'VAR': return <div className="w-8 h-6 bg-slate-700 rounded flex items-center justify-center text-[8px] font-black border border-slate-500">VAR</div>;
            case 'SUBSTITUTION': return <RefreshCcw size={16} className="text-blue-400" />;
            case 'WHISTLE': return <div className="text-slate-400 text-xs uppercase font-bold border border-slate-600 px-2 py-0.5 rounded">Fin Période</div>;
            default: return <div className="w-2 h-2 rounded-full bg-slate-500" />;
        }
    };

    if (isSystem) {
        return (
            <div className={`flex flex-col items-center justify-center py-2 ${containerStyle}`}>
                <div className="bg-slate-800/80 px-4 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                    {getIcon()}
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{event.text || event.type}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${alignClass} py-1 animate-fade-in ${containerStyle}`}>
            <div className={`flex items-center gap-3 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Minute */}
                <div className="text-xs font-mono font-bold text-indigo-400 min-w-[24px] text-center">
                    {event.minute}'
                </div>

                {/* Icon */}
                <div className="relative">
                    {getIcon()}
                    {event.is_cancelled && (
                        <div className="absolute -top-1 -right-1 bg-red-600 text-[8px] px-1 rounded-full font-bold">VAR</div>
                    )}
                </div>

                {/* Content */}
                <div className={`flex flex-col ${alignClass}`}>
                    <span className={`text-sm font-bold text-slate-100 ${textStyle}`}>
                        {event.text || event.type}
                    </span>
                    {event.player_main && (
                        <span className="text-xs text-slate-400">{event.player_main}</span>
                    )}
                    {event.player_assist && (
                        <span className="text-[10px] text-slate-500">({event.player_assist})</span>
                    )}
                </div>
            </div>
        </div>
    );
};

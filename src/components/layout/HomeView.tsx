import React, { useState, useEffect } from 'react';
import { Trophy, Bell, Calendar, Star, ChevronDown, Coins, Eye, EyeOff } from 'lucide-react';
import { MOCK_DATES, MOCK_LEAGUES, MOCK_MATCHES } from '../../data/mockData';
import { MatchCard } from '../match/MatchCard';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { ProgressBar } from '../ui/ProgressBar';
import { FavoriteButton } from '../ui/FavoriteButton';
import { GuestWallModal } from '../auth/GuestWallModal';
import type { RichUserProfile } from '../../types/types';

interface HomeViewProps {
    user: RichUserProfile;
    onNavigate: (view: string) => void;
    onMatchClick: (match: any) => void;
    toggleNotifications: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, onNavigate, onMatchClick, toggleNotifications }) => {
    const [selectedDate, setSelectedDate] = useState(0);

    // No Spoiler Mode - persisté dans localStorage
    const [isSpoilerFree, setIsSpoilerFree] = useState(() => {
        const saved = localStorage.getItem('betarena_no_spoiler');
        return saved === 'true';
    });

    // Sauvegarder le mode No Spoiler dans localStorage
    useEffect(() => {
        localStorage.setItem('betarena_no_spoiler', String(isSpoilerFree));
    }, [isSpoilerFree]);

    const toggleSpoilerMode = () => setIsSpoilerFree(!isSpoilerFree);

    // Guest Wall Modal state
    const [showGuestWall, setShowGuestWall] = useState(false);

    // Grouper les matchs par ligue (comme dans Maquette.tsx)
    const matchesByLeague = MOCK_MATCHES.reduce((acc: Record<string, any[]>, match) => {
        // Filtre date simplifié
        if (selectedDate === 0 && match.time === 'Demain') return acc;
        if (!acc[match.competition]) acc[match.competition] = [];
        acc[match.competition].push(match);
        return acc;
    }, {});

    // Matchs favoris pour le carousel
    const favoriteMatches = MOCK_MATCHES.filter(m => m.favorite);

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <header className="pt-12 pb-2 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-900">
                {/* Top Bar */}
                <div className="px-5 flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('PROFILE')}>
                        <AvatarDisplay avatar={user.avatar} frame={user.frame} level={user.level} />
                        <div>
                            <h2 className="text-sm font-black text-white leading-none">{user.username}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-16"><ProgressBar value={user.xp} /></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* No Spoiler Toggle */}
                        <button
                            onClick={toggleSpoilerMode}
                            className={`p-2.5 rounded-full border transition-all active:scale-95 ${isSpoilerFree
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                                }`}
                            title={isSpoilerFree ? 'Afficher les scores' : 'Masquer les scores'}
                        >
                            {isSpoilerFree ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button onClick={toggleNotifications} className="p-2.5 bg-slate-900 rounded-full border border-slate-800 relative text-slate-400 active:scale-95 transition-transform">
                            <Bell size={18} />
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-950 shadow-lg" />
                        </button>
                        <div onClick={() => onNavigate('SHOP')} className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 cursor-pointer active:scale-95 transition-transform">
                            <Coins size={14} className="text-yellow-500" />
                            <span className="text-sm font-black text-white">{user.coins.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Date Selector */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
                    <button className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex-shrink-0">
                        <Calendar size={18} />
                    </button>
                    {MOCK_DATES.map((date) => (
                        <button
                            key={date.id}
                            onClick={() => setSelectedDate(date.id)}
                            className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl min-w-[70px] transition-all border ${selectedDate === date.id
                                ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-105'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                                }`}
                        >
                            <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{date.label === "AUJOURD'HUI" ? "AUJ." : date.label}</span>
                            <span className="text-xs font-bold leading-none mt-0.5">{date.short.split(' ')[1]}</span>
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 no-scrollbar">
                {/* Matchs Favoris (Carousel Horizontal) */}
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" /> A l'affiche
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-500">Voir tout</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {favoriteMatches.map(match => (
                            <div
                                key={match.id}
                                onClick={() => onMatchClick(match)}
                                className="min-w-[260px] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy size={40} /></div>
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-3">
                                    <span>{match.competition}</span>
                                    {match.status === 'LIVE' && <span className="text-red-500 animate-pulse">LIVE {match.minute}'</span>}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-3xl">{match.homeLogo}</span>
                                        <span className="text-xs font-bold text-white">{match.home}</span>
                                    </div>
                                    <div className="text-2xl font-black text-white bg-slate-900/50 px-3 py-1 rounded-lg backdrop-blur-sm">
                                        {match.status === 'SCHEDULED'
                                            ? 'VS'
                                            : isSpoilerFree
                                                ? '? - ?'
                                                : `${match.score.h}-${match.score.a}`
                                        }
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-3xl">{match.awayLogo}</span>
                                        <span className="text-xs font-bold text-white">{match.away}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ligues Groupées */}
                <div className="space-y-6">
                    {Object.entries(matchesByLeague).map(([leagueName, matches]) => (
                        <div key={leagueName} className="animate-slide-up">
                            <div className="flex items-center gap-2 mb-3 px-1 sticky top-0 bg-slate-950/50 backdrop-blur-sm py-2 z-10">
                                <span className="text-xl">{(MOCK_LEAGUES as Record<string, { country: string; logo: string }>)[leagueName]?.country || '🌍'}</span>
                                <h3 className="text-sm font-black text-white uppercase tracking-wide flex-1">{leagueName}</h3>
                                <FavoriteButton
                                    entityType="LEAGUE"
                                    entityId={leagueName}
                                    size="sm"
                                    onGuestBlock={() => setShowGuestWall(true)}
                                />
                                <ChevronDown size={14} className="text-slate-600" />
                            </div>
                            <div className="space-y-2">
                                {matches.map((match: any) => (
                                    <MatchCard key={match.id} match={match} onClick={() => onMatchClick(match)} noSpoiler={isSpoilerFree} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Guest Wall Modal */}
            <GuestWallModal
                isOpen={showGuestWall}
                onClose={() => setShowGuestWall(false)}
                onLogin={() => setShowGuestWall(false)}
                onSignup={() => setShowGuestWall(false)}
            />
        </div>
    );
};

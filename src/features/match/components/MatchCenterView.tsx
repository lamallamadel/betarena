import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, Share2, Coins, Clock, Info, Users, RefreshCcw
} from 'lucide-react';
import { SoccerPitch } from './SoccerPitch';
import { PredictionTrends } from './PredictionTrends';
import { ChatRoom } from '../../../components/social/chatRoom';
import { TeamLogo } from '../../../components/ui/TeamLogo';
import { useChat } from '../../../hooks/useChat';
import { useMatchLive } from '../hooks/useMatchLive';
import { TimelineEvent } from './TimelineEvent';
import { MatchSimulator } from '../../../utils/matchSimulator';
import { ShareModal } from '../../../components/social/ShareModal';
import type { RichUserProfile, Prediction } from '../../../types/types';
import type { Match } from '../types';

interface MatchCenterViewProps {
    match: Match; 
    user: RichUserProfile;
    onNavigate: (view: string) => void;
    onPlaceBet: (type: '1N2' | 'EXACT_SCORE', selection: string, amount: number, odd?: { label: string, val: number } | null) => void;
    // SFD RG-A01/A02: Lock states
    is1N2Locked?: boolean;
    isScoreLocked?: boolean;
    // SFD: Existing bet for "Update" button
    existingBet1N2?: Prediction;
    existingBetScore?: Prediction;
    // SFD Phase 4: Pari Mutuel mode
    isPariMutuel?: boolean;
    poolStats?: {
        totalPool: number;
        betsOn1: number;
        betsOnN: number;
        betsOn2: number;
        betsOnScores: Record<string, number>;
    };
}

export const MatchCenterView: React.FC<MatchCenterViewProps> = ({
    match, user, onNavigate, onPlaceBet,
    is1N2Locked = false, isScoreLocked = false,
    existingBet1N2, existingBetScore,
    isPariMutuel = false, poolStats
}) => {
    const [matchTab, setMatchTab] = useState<'timeline' | 'compos' | 'pronos' | 'chat'>('timeline');
    const [activeRoom, setActiveRoom] = useState<string>('GLOBAL');
    // Adapt user/profile for useChat (expects auth user + profile data)
    const isGuest = !user.uid || user.uid === 'guest';
    const { messages, sendMessage, reportMessage, chatEndRef, usersOnline } = useChat(
        activeRoom,
        { uid: user.uid }, // Mock auth user object
        { pseudo: user.username, ...user }, // Mock profile object with pseudo
        isGuest
    );



    // SFD Phase 6: Live Data
    // Use match.id or default if new match
    const matchIdStr = match.id ? String(match.id) : 'match_demo';
    const { liveMatch, events } = useMatchLive(matchIdStr, match);
    // Use live data if available, else static props
    const currentMatch = liveMatch || match;
    const currentHomeScore = currentMatch.score?.h ?? 0;
    const currentAwayScore = currentMatch.score?.a ?? 0;
    const currentMinute = currentMatch.minute ?? 0;

    // GOAL ANIMATION LOGIC
    const [showGoalOverlay, setShowGoalOverlay] = useState<{ team: string, player: string } | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const lastEventIdRef = React.useRef<string | null>(null);
    const isInitialLoadRef = React.useRef(true); // Skip events on first load

    useEffect(() => {
        if (events.length > 0) {
            // Skip the first load of events (they are historical)
            if (isInitialLoadRef.current) {
                isInitialLoadRef.current = false;
                lastEventIdRef.current = events[0]?.id || null;
                return;
            }

            const latest = events[0];
            // Only trigger if new event AND it's a Goal AND it's not cancelled
            if (latest.id !== lastEventIdRef.current) {
                lastEventIdRef.current = latest.id;
                if (latest.type === 'GOAL' && !latest.is_cancelled) {
                    setShowGoalOverlay({
                        team: latest.team === 'home' ? match.home : match.away,
                        player: latest.player_main || 'Buteur'
                    });
                    setTimeout(() => setShowGoalOverlay(null), 3000); // Hide after 3s
                }
            }
        }
    }, [events, match.home, match.away]);

    const [activeLineupTeam, setActiveLineupTeam] = useState<'home' | 'away'>('home');
    const [pronoType, setPronoType] = useState<'1N2' | 'EXACT_SCORE'>('1N2');
    const [betAmount, setBetAmount] = useState(100);
    const [selectedOdd, setSelectedOdd] = useState<{ label: string, val: number } | null>(null);
    const [scoreHome, setScoreHome] = useState(0);
    const [scoreAway, setScoreAway] = useState(0);

    const isConfirmed = match.lineups?.confirmed;

    const handlePlaceBet = () => {
        if (pronoType === '1N2' && selectedOdd) {
            onPlaceBet('1N2', selectedOdd.label, betAmount, selectedOdd);
        } else if (pronoType === 'EXACT_SCORE') {
            // For exact score, create a virtual odd
            const exactScoreOdd = { label: `${scoreHome}-${scoreAway}`, val: 3.5 };
            onPlaceBet('EXACT_SCORE', `${scoreHome}-${scoreAway}`, betAmount, exactScoreOdd);
        }
    };



    // Helper to format minute to MM:SS (Simulated for this demo, usually backend provides specific time)
    // In a real scenario, we might have a `startTime` timestamp and calculate diff.
    // For this prototype using `minute` integer:
    const formatMatchTime = (min: number | string) => {
        if (!min && min !== 0) return "--:--";
        if (typeof min === 'string' && min.includes(':')) return min; // Already formatted
        return `${min}:00`; // Simple XX:00 for integer minutes
    };

    const extractTime = (timeStr: string | number) => {
        if (!timeStr) return "À VENIR";
        // If it looks like "20:00", return it. If it's a date object, format it.
        return timeStr.toString().replace('LIVE ', ''); // Cleanup
    };


    // Calculate Active Bet for Share Modal
    const activeBet = existingBet1N2 || existingBetScore ? {
        potentialGain: existingBet1N2
            ? Math.floor(existingBet1N2.amount * (existingBet1N2.odd || 0))
            : existingBetScore
                ? (isPariMutuel ? 'Variable' : Math.floor(existingBetScore.amount * 3.5))
                : 0
    } : undefined;

    return (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up relative overflow-hidden">
            {/* GOAL OVERLAY */}
            {showGoalOverlay && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                    <div className="text-6xl mb-4 animate-bounce">⚽</div>
                    <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse">
                        GOAL !!!
                    </h1>
                    <div className="mt-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400 uppercase tracking-widest">{showGoalOverlay.team}</p>
                        <p className="text-white text-lg font-mono mt-1">{showGoalOverlay.player}</p>
                    </div>
                </div>
            )}
            {/* Header Match (Image de fond + Score) */}
            <div className="relative h-64 w-full overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                <div className="absolute top-0 w-full p-4 pt-12 flex justify-between items-center z-20">
                    <button onClick={(e) => { e.stopPropagation(); onNavigate('HOME'); }} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors z-50"><ChevronLeft size={20} /></button>
                    <span className="px-3 py-1 rounded-full bg-slate-950/50 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {['LIVE', 'LIVE_1ST_HALF', 'LIVE_2ND_HALF', 'HALF_TIME'].includes(match.status) ? `LIVE ${currentMinute}'` : match.competition}
                    </span>
                    <button onClick={() => setShowShareModal(true)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"><Share2 size={18} /></button>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 mt-6">
                    <div className="flex items-center justify-between w-full h-full relative z-10">
                        {/* HOME */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="transform hover:scale-110 transition-transform">
                                <TeamLogo src={match.homeLogo} alt={match.home} size="xl" />
                            </div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter text-center leading-none">{match.home}</h2>
                        </div>

                        {/* SCORE */}
                        <div className="flex flex-col items-center gap-1 w-1/3 relative z-10 box-border">
                            <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 shadow-xl mb-2">
                                <span className={`text-xs font-bold flex items-center gap-1.5 uppercase tracking-widest ${['LIVE', 'LIVE_1ST_HALF', 'LIVE_2ND_HALF', 'HALF_TIME'].includes(currentMatch.status) ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {['LIVE', 'LIVE_1ST_HALF', 'LIVE_2ND_HALF'].includes(currentMatch.status) && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                    {['LIVE', 'LIVE_1ST_HALF', 'LIVE_2ND_HALF'].includes(currentMatch.status) ? 'LIVE' : currentMatch.status === 'HALF_TIME' ? 'MI-TEMPS' : currentMatch.status === 'FINISHED' ? 'TERMINÉ' : extractTime(match.time)}
                                </span>
                            </div>
                            <div className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl flex items-center gap-2">
                                <span key={`home-${currentHomeScore}`} className="animate-pulse-once">{currentHomeScore}</span>
                                <span className="text-slate-600 text-3xl">:</span>
                                <span key={`away-${currentAwayScore}`} className="animate-pulse-once">{currentAwayScore}</span>
                            </div>
                            <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded border ${match.status === 'LIVE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-800/50 border-slate-700'}`}>
                                {formatMatchTime(currentMinute)}
                            </span>
                        </div>

                        {/* AWAY */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="transform hover:scale-110 transition-transform">
                                <TeamLogo src={match.awayLogo} alt={match.away} size="xl" />
                            </div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter text-center leading-none">{match.away}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* ADMIN SIMULATOR (DEV ONLY) */}
            <div className="mb-4 mx-4 p-2 bg-slate-900/50 border border-slate-800 rounded-lg flex flex-wrap gap-2 justify-center">
                <span className="text-[10px] text-slate-500 w-full text-center uppercase font-bold">Admin Simulator</span>
                <button onClick={() => MatchSimulator.triggerGoal(matchIdStr, 'home', 'Home Player', currentMinute)} className="px-2 py-1 bg-indigo-600 text-xs rounded text-white active:scale-95">Goal Home</button>
                <button onClick={() => MatchSimulator.triggerGoal(matchIdStr, 'away', 'Away Player', currentMinute)} className="px-2 py-1 bg-pink-600 text-xs rounded text-white active:scale-95">Goal Away</button>
                <button onClick={() => MatchSimulator.updateMinute(matchIdStr, currentMinute + 1)} className="px-2 py-1 bg-slate-700 text-xs rounded text-white active:scale-95">+1 Min</button>
                <button onClick={() => events[0] && MatchSimulator.triggerVarCancel(matchIdStr, events[0].id, events[0].team as any)} className="px-2 py-1 bg-red-900/50 border border-red-500 text-red-400 text-xs rounded active:scale-95">VAR Cancel Last</button>
                {match.api_id && (
                    <button
                        onClick={async () => {
                            const { getFunctions, httpsCallable } = await import('firebase/functions');
                            const functions = getFunctions();
                            const syncLive = httpsCallable(functions, 'syncLiveMatch');
                            try {
                                await syncLive({ apiId: match.api_id });
                            } catch (e) {
                                console.error('Live sync error', e);
                            }
                        }}
                        className="px-2 py-1 bg-emerald-700 text-xs rounded text-white active:scale-95 flex items-center gap-1"
                    >
                        <RefreshCcw size={12} /> Sync API
                    </button>
                )}
            </div>

            {/* TAB SELECTOR - 4 onglets comme Maquette */}
            <div className="flex border-b border-slate-900 bg-slate-950 px-4 sticky top-0 z-20">
                {['TIMELINE', 'COMPOS', 'PRONOS', 'CHAT'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setMatchTab(tab.toLowerCase() as 'timeline' | 'compos' | 'pronos' | 'chat')}
                        className={`flex-1 py-4 text-[10px] font-black tracking-widest border-b-2 transition-colors ${matchTab === tab.toLowerCase() ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar pb-24">
                {/* ONGLET TIMELINE - Événements du match */}
                {matchTab === 'timeline' && (
                    <div className="space-y-1 relative before:content-[''] before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800/50 pl-0">
                        {events.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm">Aucun événement</div>
                        ) : (
                            events.map(event => (
                                <TimelineEvent key={event.id} event={event} />
                            ))
                        )}
                    </div>
                )}

                {/* ONGLET COMPOS - Compositions d'équipes */}
                {matchTab === 'compos' && (
                    <div className="animate-slide-up">
                        {/* Toggle Equipes (Compo) */}
                        <div className="flex justify-center mb-6 bg-slate-900/50 rounded-full p-1 w-fit mx-auto border border-slate-800">
                            <button onClick={() => setActiveLineupTeam('home')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeLineupTeam === 'home' ? 'bg-white text-black' : 'text-slate-500'}`}>{match.home}</button>
                            <button onClick={() => setActiveLineupTeam('away')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeLineupTeam === 'away' ? 'bg-white text-black' : 'text-slate-500'}`}>{match.away}</button>
                        </div>

                        {match.lineups && match.lineups[activeLineupTeam]?.starters ? (
                            <>
                                <SoccerPitch starters={match.lineups[activeLineupTeam].starters} isHome={activeLineupTeam === 'home'} />

                                {!isConfirmed && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-start gap-3 mb-6">
                                        <Info size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-emerald-500/80 font-bold uppercase leading-relaxed">
                                            Ceci est une composition probable. La composition officielle sera disponible environ 60 minutes avant le coup d'envoi.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-2">Onze de Départ ({match.lineups[activeLineupTeam].formation})</h4>
                                        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                                            {match.lineups[activeLineupTeam].starters.map((p, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 border-b border-slate-800/50 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-5 text-[10px] font-black text-slate-600">{p.num}</span>
                                                        <span className="text-xs font-bold text-white uppercase">{p.name}</span>
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-500 px-2 py-0.5 bg-slate-950 rounded uppercase">{p.pos || 'TIT'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {match.lineups[activeLineupTeam].bench && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-2">Remplaçants</h4>
                                            <div className="flex flex-wrap gap-2 px-2">
                                                {match.lineups[activeLineupTeam].bench.map((name: string, i: number) => (
                                                    <span key={i} className="text-[9px] font-black text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg uppercase">{name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <Users size={40} className="text-slate-800" />
                                <div className="text-xs font-black text-slate-600 uppercase tracking-widest">Les compositions seront <br /> bientôt disponibles</div>
                            </div>
                        )}
                    </div>
                )}

                {matchTab === 'pronos' && (
                    <div className="animate-slide-up space-y-6">
                        {/* Tendance Globale (RG-06) */}
                        <PredictionTrends matchId={String(match.id)} />

                        {/* Tabs 1N2 vs Score Exact */}
                        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
                            <button
                                onClick={() => setPronoType('1N2')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${pronoType === '1N2' ? 'bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-500'}`}
                            >
                                🏆 Vainqueur (1N2)
                            </button>
                            <button
                                onClick={() => setPronoType('EXACT_SCORE')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${pronoType === 'EXACT_SCORE' ? 'bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-500'}`}
                            >
                                🎯 Score Exact
                            </button>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-[24px]">
                            {/* Sélecteur de Mise - Variable (SFD Flux B) */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-white uppercase">💰 Mise</span>
                                    <span className="text-[10px] text-slate-500">Solde: {user.coins} 🪙</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        min="10"
                                        max={user.coins}
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
                                        className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-black text-center focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                    <div className="flex gap-1 flex-1">
                                        {[50, 100, 200, 500].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setBetAmount(v)}
                                                disabled={v > user.coins}
                                                className={`flex-1 py-2 rounded-lg text-[9px] font-black border transition-all ${betAmount === v ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-800 text-slate-500 hover:border-slate-600'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Interface 1N2 */}
                            {pronoType === '1N2' && (
                                <>
                                    {/* RG-A01: Avertissement verrouillage 1N2 */}
                                    {match.status !== 'SCHEDULED' && match.status !== 'PRE_MATCH' && (
                                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-4 flex items-start gap-2">
                                            <span className="text-red-500 shrink-0">🔒</span>
                                            <p className="text-[9px] font-bold text-red-500/80 leading-relaxed">
                                                Paris 1N2 fermés - Le match a commencé
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {[
                                            { l: '1', v: match.odds?.h || 0, label: match.home },
                                            { l: 'N', v: match.odds?.n || 0, label: 'Nul' },
                                            { l: '2', v: match.odds?.a || 0, label: match.away }
                                        ].map((o, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedOdd({ label: o.l, val: o.v })}
                                                disabled={match.status !== 'SCHEDULED' && match.status !== 'PRE_MATCH'}
                                                className={`py-4 rounded-xl border flex flex-col items-center transition-all ${match.status !== 'SCHEDULED' && match.status !== 'PRE_MATCH' ? 'opacity-50 cursor-not-allowed' : ''} ${selectedOdd?.label === o.l ? 'bg-emerald-500 border-emerald-500 text-black scale-105 shadow-lg shadow-emerald-500/20' : 'bg-slate-950 border-slate-800 text-white hover:border-slate-700'}`}
                                            >
                                                <span className="text-[9px] font-bold opacity-60 mb-1 uppercase">{o.label}</span>
                                                <span className="text-xl font-black">{o.v}</span>
                                                <span className="text-[8px] font-bold opacity-50 mt-1">{o.label === 'N' ? 'Match Nul' : o.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedOdd && (
                                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl mb-4 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Gain Potentiel</span>
                                            <span className="text-lg font-black text-yellow-500 flex items-center gap-1">
                                                {Math.floor(betAmount * selectedOdd.val)} <Coins size={14} />
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Interface Score Exact */}
                            {pronoType === 'EXACT_SCORE' && (
                                <>
                                    {/* RG-A02: Avertissement verrouillage Score Exact */}
                                    {isScoreLocked && (
                                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-4 flex items-start gap-2">
                                            <span className="text-red-500 shrink-0">🔒</span>
                                            <p className="text-[9px] font-bold text-red-500/80 leading-relaxed">
                                                Paris Score Exact fermés - 2ème mi-temps commencée
                                            </p>
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase mb-3 text-center">
                                            Prédisez le score final
                                        </h5>
                                        <div className="flex items-center justify-center gap-4 mb-4">
                                            {/* Home Score */}
                                            <div className="flex flex-col items-center gap-2">
                                                <TeamLogo src={match.homeLogo} alt={match.home} size="md" />
                                                <div className={`flex flex-col items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 ${isScoreLocked ? 'opacity-50' : ''}`}>
                                                    <button
                                                        onClick={() => setScoreHome(Math.min(9, scoreHome + 1))}
                                                        disabled={isScoreLocked}
                                                        className="w-10 h-10 bg-emerald-500 disabled:bg-slate-700 text-black disabled:text-slate-500 rounded-xl font-black text-xl active:scale-95 transition-transform disabled:cursor-not-allowed"
                                                    >
                                                        +
                                                    </button>
                                                    <span className="text-4xl font-black text-white w-16 text-center">{scoreHome}</span>
                                                    <button
                                                        onClick={() => setScoreHome(Math.max(0, scoreHome - 1))}
                                                        disabled={isScoreLocked}
                                                        className="w-10 h-10 bg-slate-800 disabled:bg-slate-700 text-white disabled:text-slate-500 rounded-xl font-black text-xl active:scale-95 transition-transform disabled:cursor-not-allowed"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>

                                            <span className="text-3xl font-black text-slate-600">:</span>

                                            {/* Away Score */}
                                            <div className="flex flex-col items-center gap-2">
                                                <TeamLogo src={match.awayLogo} alt={match.away} size="md" />
                                                <div className={`flex flex-col items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 ${isScoreLocked ? 'opacity-50' : ''}`}>
                                                    <button
                                                        onClick={() => setScoreAway(Math.min(9, scoreAway + 1))}
                                                        disabled={isScoreLocked}
                                                        className="w-10 h-10 bg-emerald-500 disabled:bg-slate-700 text-black disabled:text-slate-500 rounded-xl font-black text-xl active:scale-95 transition-transform disabled:cursor-not-allowed"
                                                    >
                                                        +
                                                    </button>
                                                    <span className="text-4xl font-black text-white w-16 text-center">{scoreAway}</span>
                                                    <button
                                                        onClick={() => setScoreAway(Math.max(0, scoreAway - 1))}
                                                        disabled={isScoreLocked}
                                                        className="w-10 h-10 bg-slate-800 disabled:bg-slate-700 text-white disabled:text-slate-500 rounded-xl font-black text-xl active:scale-95 transition-transform disabled:cursor-not-allowed"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scores Rapides */}
                                        <div className={`bg-slate-950 border border-slate-800 p-3 rounded-xl ${isScoreLocked ? 'opacity-50' : ''}`}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase text-center mb-2">Scores Fréquents</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['1-0', '2-0', '0-1', '1-1', '2-1', '1-2', '2-2', '0-0'].map(score => {
                                                    const [h, a] = score.split('-').map(Number);
                                                    return (
                                                        <button
                                                            key={score}
                                                            onClick={() => { setScoreHome(h); setScoreAway(a); }}
                                                            disabled={isScoreLocked}
                                                            className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-black text-white hover:border-emerald-500 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-800"
                                                        >
                                                            {score}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl mb-4 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                {isPariMutuel ? 'Gain Estimé' : 'Gain Potentiel'}
                                            </span>
                                            {isPariMutuel && (
                                                <span className="text-[8px] text-slate-600">Varie selon les mises</span>
                                            )}
                                        </div>
                                        <span className={`text-lg font-black flex items-center gap-1 ${isPariMutuel ? 'text-orange-400' : 'text-yellow-500'}`}>
                                            {(() => {
                                                if (isPariMutuel && poolStats) {
                                                    // Calcul Pari Mutuel: (mise / mises_sur_choix) × total_pool
                                                    const score = `${scoreHome}-${scoreAway}`;
                                                    const betsOnSelection = poolStats.betsOnScores?.[score] || 0;
                                                    const newBetsOnSelection = betsOnSelection + betAmount;
                                                    const newTotalPool = poolStats.totalPool + betAmount;
                                                    return newBetsOnSelection > 0
                                                        ? Math.floor((betAmount / newBetsOnSelection) * newTotalPool)
                                                        : newTotalPool;
                                                }
                                                // Mode fixe: mise × cote
                                                return Math.floor(betAmount * 3.5);
                                            })()}
                                            ~<Coins size={14} />
                                        </span>
                                    </div>

                                    {/* Info RG-02 */}
                                    {match.status === 'LIVE' && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-4 flex items-start gap-2">
                                            <Clock size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                                            <p className="text-[9px] font-bold text-yellow-500/80 leading-relaxed">
                                                Modifiable jusqu'à la fin de la 1ère mi-temps (45')
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Bouton de Validation - SFD Compliant */}
                            {(() => {
                                // Determine lock state based on bet type
                                const isLocked = pronoType === '1N2' ? is1N2Locked : isScoreLocked;
                                const existingBet = pronoType === '1N2' ? existingBet1N2 : existingBetScore;
                                const needsSelection = pronoType === '1N2' && !selectedOdd;
                                const insufficientCoins = user.coins < betAmount;

                                // SFD: Button text based on state
                                let buttonText = '✅ Valider le Pronostic';
                                if (isLocked) {
                                    buttonText = '🔒 Les paris sont fermés';
                                } else if (insufficientCoins) {
                                    buttonText = '❌ Coins Insuffisants';
                                } else if (needsSelection) {
                                    buttonText = '⚠️ Sélectionnez une cote';
                                } else if (existingBet) {
                                    buttonText = '🔄 Mettre à jour le pari';
                                }

                                return (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handlePlaceBet}
                                            disabled={isLocked || needsSelection || insufficientCoins}
                                            className="flex-1 bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 py-4 rounded-xl font-black text-black text-sm uppercase transition-all active:scale-95 shadow-lg disabled:shadow-none"
                                        >
                                            {buttonText}
                                        </button>

                                        {existingBet && (
                                            <button
                                                onClick={() => setShowShareModal(true)}
                                                className="px-4 bg-indigo-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                                                title="Partager mon pari"
                                            >
                                                <Share2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Solde Restant */}
                            <div className="flex justify-between items-center mt-3 px-2">
                                <span className="text-[9px] font-bold text-slate-600 uppercase">Solde après pari</span>
                                <span className="text-xs font-black text-white flex items-center gap-1">
                                    {user.coins - betAmount} <Coins size={12} className="text-yellow-500" />
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {matchTab === 'chat' && (
                    <div className="h-full flex flex-col pb-2">
                        <ChatRoom
                            messages={messages}
                            onSendMessage={sendMessage}
                            onReportMessage={reportMessage}
                            activeRoom={activeRoom}
                            setActiveRoom={setActiveRoom}
                            chatEndRef={chatEndRef}
                            currentUserId={user.uid}
                            matchId={`match-${match.id || 'default'}`}
                            usersOnline={usersOnline}
                            isGuest={isGuest}
                        />
                    </div>
                )}
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                match={currentMatch}
                user={user}
                bet={activeBet}
            />
        </div>
    );
};

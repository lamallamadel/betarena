import React, { useState } from 'react';
import {
    Activity, ChevronLeft, Share2, Timer, Coins, Clock, Send, Info, Users, Award
} from 'lucide-react';
import { SoccerPitch } from './SoccerPitch';
import { PredictionTrends } from './PredictionTrends';
import type { RichUserProfile } from '../../types/types';

interface MatchCenterViewProps {
    match: any; // Ideally typed with Match type but simplified for migration
    user: RichUserProfile;
    onNavigate: (view: string) => void;
    onPlaceBet: (type: '1N2' | 'EXACT_SCORE', selection: any, amount: number, odd?: { label: string, val: number } | null) => void;
    onShare: () => void;
}

export const MatchCenterView: React.FC<MatchCenterViewProps> = ({ match, user, onNavigate, onPlaceBet, onShare }) => {
    const [matchTab, setMatchTab] = useState<'timeline' | 'compos' | 'pronos' | 'chat'>('timeline');
    const [activeLineupTeam, setActiveLineupTeam] = useState<'home' | 'away'>('home');
    const [pronoType, setPronoType] = useState<'1N2' | 'EXACT_SCORE'>('1N2');
    const [betAmount, setBetAmount] = useState(100);
    const [selectedOdd, setSelectedOdd] = useState<{ label: string, val: number } | null>(null);
    const [scoreHome, setScoreHome] = useState(0);
    const [scoreAway, setScoreAway] = useState(0);
    const [chatMsg, setChatMsg] = useState('');

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

    return (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up">
            {/* Header Match (Image de fond + Score) */}
            <div className="relative h-64 w-full overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                <div className="absolute top-0 w-full p-4 pt-12 flex justify-between items-center z-10">
                    <button onClick={() => onNavigate('HOME')} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"><ChevronLeft size={20} /></button>
                    <span className="px-3 py-1 rounded-full bg-slate-950/50 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {match.status === 'LIVE' ? match.time : match.competition}
                    </span>
                    <button onClick={onShare} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"><Share2 size={18} /></button>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 mt-6">
                    <div className="flex items-center justify-between w-full h-full relative z-10">
                        {/* HOME */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <span className="text-4xl shadow-xl filter drop-shadow-lg transform hover:scale-110 transition-transform">{match.homeLogo}</span>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter text-center leading-none">{match.home}</h2>
                            {match.status === 'LIVE' && <div className="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-md mt-1">4 Tirs</div>}
                        </div>

                        {/* SCORE */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-black text-white">{match.score.h}</span>
                                <span className="text-xs font-bold text-slate-500">-</span>
                                <span className="text-4xl font-black text-white">{match.score.a}</span>
                            </div>
                            {match.status === 'LIVE' && (
                                <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                                    <Timer size={12} className="text-emerald-500 animate-pulse" />
                                    <span className="text-xs font-mono font-bold text-emerald-500">{match.minute}'</span>
                                </div>
                            )}
                        </div>

                        {/* AWAY */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <span className="text-4xl shadow-xl filter drop-shadow-lg transform hover:scale-110 transition-transform">{match.awayLogo}</span>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter text-center leading-none">{match.away}</h2>
                            {match.status === 'LIVE' && <div className="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-md mt-1">2 Tirs</div>}
                        </div>
                    </div>
                </div>
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
                    <div className="space-y-4">
                        {match.events && match.events.length > 0 ? match.events.map((e: any, i: number) => (
                            <div key={i} className="flex gap-3 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="flex flex-col items-center w-8 pt-1">
                                    <span className="text-xs font-black text-slate-500">{e.min}'</span>
                                    <div className="w-px h-full bg-slate-800 mt-1" />
                                </div>
                                <div className="flex-1 bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${e.type === 'GOAL' ? 'bg-emerald-500/10 text-emerald-500' : e.type === 'CARD_RED' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        {e.type === 'GOAL' ? <Award size={16} /> : <Activity size={16} />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white">{e.player}</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase">
                                            {e.type}{e.detail && ` (${e.detail})`} - {e.team === 'home' ? match.home : match.away}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-600 font-bold text-xs uppercase">
                                Aucun événement majeur
                            </div>
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
                                            {match.lineups[activeLineupTeam].starters.map((p: any, i: number) => (
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
                        <PredictionTrends matchId={match.id} />

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
                            {/* Sélecteur de Mise */}
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black text-white uppercase">💰 Mise</span>
                                <div className="flex gap-2">
                                    {[50, 100, 200].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setBetAmount(v)}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${betAmount === v ? 'bg-emerald-500 border-emerald-500 text-black scale-105' : 'border-slate-800 text-slate-500'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
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
                                            { l: '1', v: match.odds?.h, label: match.home },
                                            { l: 'N', v: match.odds?.n, label: 'Nul' },
                                            { l: '2', v: match.odds?.a, label: match.away }
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
                                    <div className="mb-4">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase mb-3 text-center">
                                            Prédisez le score final
                                        </h5>
                                        <div className="flex items-center justify-center gap-4 mb-4">
                                            {/* Home Score */}
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-xl">{match.homeLogo}</span>
                                                <div className="flex flex-col items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                                                    <button
                                                        onClick={() => setScoreHome(Math.min(9, scoreHome + 1))}
                                                        className="w-10 h-10 bg-emerald-500 text-black rounded-xl font-black text-xl active:scale-95 transition-transform"
                                                    >
                                                        +
                                                    </button>
                                                    <span className="text-4xl font-black text-white w-16 text-center">{scoreHome}</span>
                                                    <button
                                                        onClick={() => setScoreHome(Math.max(0, scoreHome - 1))}
                                                        className="w-10 h-10 bg-slate-800 text-white rounded-xl font-black text-xl active:scale-95 transition-transform"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>

                                            <span className="text-3xl font-black text-slate-600">:</span>

                                            {/* Away Score */}
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-xl">{match.awayLogo}</span>
                                                <div className="flex flex-col items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                                                    <button
                                                        onClick={() => setScoreAway(Math.min(9, scoreAway + 1))}
                                                        className="w-10 h-10 bg-emerald-500 text-black rounded-xl font-black text-xl active:scale-95 transition-transform"
                                                    >
                                                        +
                                                    </button>
                                                    <span className="text-4xl font-black text-white w-16 text-center">{scoreAway}</span>
                                                    <button
                                                        onClick={() => setScoreAway(Math.max(0, scoreAway - 1))}
                                                        className="w-10 h-10 bg-slate-800 text-white rounded-xl font-black text-xl active:scale-95 transition-transform"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scores Rapides */}
                                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase text-center mb-2">Scores Fréquents</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['1-0', '2-0', '0-1', '1-1', '2-1', '1-2', '2-2', '0-0'].map(score => {
                                                    const [h, a] = score.split('-').map(Number);
                                                    return (
                                                        <button
                                                            key={score}
                                                            onClick={() => { setScoreHome(h); setScoreAway(a); }}
                                                            className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-black text-white hover:border-emerald-500 transition-colors active:scale-95"
                                                        >
                                                            {score}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl mb-4 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Gain Potentiel</span>
                                        <span className="text-lg font-black text-yellow-500 flex items-center gap-1">
                                            {Math.floor(betAmount * 3.5)} <Coins size={14} />
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

                            {/* Bouton de Validation */}
                            <button
                                onClick={handlePlaceBet}
                                disabled={pronoType === '1N2' ? !selectedOdd : false}
                                className="w-full bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 py-4 rounded-xl font-black text-black text-sm uppercase transition-all active:scale-95 shadow-lg disabled:shadow-none"
                            >
                                {user.coins < betAmount
                                    ? '❌ Coins Insuffisants'
                                    : pronoType === '1N2' && !selectedOdd
                                        ? '⚠️ Sélectionnez une cote'
                                        : '✅ Valider le Pronostic'
                                }
                            </button>

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
                    <div className="h-full flex flex-col justify-between pb-10">
                        <div className="space-y-3">
                            <div className="flex gap-2"><div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">👤</div><div className="bg-slate-900 p-2 rounded-xl rounded-tl-none text-xs text-slate-300">Allez l'OM !!</div></div>
                            <div className="flex gap-2 flex-row-reverse"><div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px]">🦁</div><div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl rounded-tr-none text-xs text-emerald-400">Jamais de la vie, Paris ce soir.</div></div>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-xl flex gap-2 border border-slate-800"><input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Message..." className="bg-transparent flex-1 text-xs text-white outline-none pl-2" /><button className="p-2 bg-emerald-500 rounded-lg text-black"><Send size={14} /></button></div>
                    </div>
                )}
            </div>
        </div >
    );
};

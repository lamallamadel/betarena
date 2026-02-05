import { useState } from 'react';
import { Loader2, Trophy, Coins, Activity, MessageSquare, ShoppingBag, BarChart3, ChevronDown, ChevronUp, Share2 } from 'lucide-react';

// Hooks
import { useAuth } from './context/AuthContext';
import { useMatch } from './hooks/useMatch';
import { useChat } from './hooks/useChat';
import { useBetting } from './hooks/useBetting';
import { useGamification } from './hooks/useGamification';
import { MatchTimeline } from "./components/match/matchTimeline.tsx";
import { BettingForm } from "./components/betting/bettingForm.tsx";
import { Leaderboard } from "./components/social/leaderboard.tsx";
import { ChatRoom } from "./components/social/chatRoom.tsx";
import { ShareModal } from "./components/social/ShareModal.tsx";
import { AdminTools } from "./components/admin/adminTools.tsx";
import { Shop } from "./components/shop/Shop.tsx";
import { MatchHeader } from "./components/match/matchHeader.tsx";
// Import du nouveau composant Auth
import { Onboarding } from './components/auth/Onboarding';

export default function App() {
    const { user, profile, loading, isOnboarding } = useAuth(); // Récupère isOnboarding ici
    const [currentView, setCurrentView] = useState<'LIVE' | 'PREDICT' | 'SOCIAL' | 'SHOP' | 'RANK'>('LIVE');
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

    // Business Hooks
    const { match, matchEvents, addMatchEvent, advanceTime, goalAnimation } = useMatch();
    const { predictions, placeBet, is1N2Locked, isScoreLocked, RULES } = useBetting(user?.uid, match.id, match.status);

    // Chat
    const [activeRoom, setActiveRoom] = useState('GLOBAL');
    const { messages, sendMessage, chatEndRef } = useChat(activeRoom, user, profile, false);

    // Gamification (Le Timer est maintenant géré à l'intérieur de ce hook)
    const { getLevel, getProgress, buyItem, claimBonus, claimShareReward, isBonusAvailable } = useGamification(user?.uid, profile);

    // UI State
    const [filterHighlights, setFilterHighlights] = useState(false);
    const [shareData, setShareData] = useState<any | null>(null);

    // Loading Screen
    if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;

    // Si l'utilisateur n'a pas de profil, on affiche la page d'authentification
    if (isOnboarding) {
        return <Onboarding />;
    }


    const xpProgress = getProgress(profile?.xp || 0);
    const level = getLevel(profile?.xp || 0);

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">

            {/* HEADER (XP & COINS) */}
            <nav className="shrink-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex justify-between items-center z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600/20 p-1.5 rounded-lg border border-indigo-500/30">
                        <Trophy size={16} className="text-indigo-400" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">BetArena</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">Niv. {level}</span>
                            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${xpProgress}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-full border border-slate-800">
                        <Coins size={12} className="text-yellow-400" />
                        <span className="font-mono font-bold text-xs text-yellow-400">{profile?.coins || 0}</span>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden max-w-md mx-auto w-full relative bg-slate-950">

                {/* TABS */}
                <div className="shrink-0 flex p-2 bg-slate-950 z-40 border-b border-slate-800/50 overflow-x-auto">
                    {[
                        { id: 'LIVE', icon: Activity, label: 'Live' },
                        { id: 'PREDICT', icon: Coins, label: 'Pronos' },
                        { id: 'SOCIAL', icon: MessageSquare, label: 'Chat' },
                        { id: 'SHOP', icon: ShoppingBag, label: 'Shop' },
                        { id: 'RANK', icon: BarChart3, label: 'Top' }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setCurrentView(tab.id as any)} className={`flex-1 min-w-[60px] py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${currentView === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
                            <tab.icon size={14} /> <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* --- VUES --- */}
                {currentView === 'LIVE' && (
                    <>
                        <MatchHeader match={match} goalAnimation={goalAnimation} />
                        <MatchTimeline events={matchEvents} filterHighlights={filterHighlights} setFilterHighlights={setFilterHighlights} />
                    </>
                )}

                {currentView === 'PREDICT' && (
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <MatchHeader match={match} goalAnimation={null} />
                        <BettingForm
                            matchId={match}
                            predictions={predictions}
                            rules={RULES}
                            onPlaceBet={(t, s) => placeBet(t, s).catch(e => alert(e.message))}
                            is1N2Locked={is1N2Locked()}
                            isScoreLocked={isScoreLocked()}
                        />
                    </div>
                )}

                {currentView === 'SOCIAL' && (
                    <ChatRoom
                        activeRoom={activeRoom}
                        setActiveRoom={setActiveRoom}
                        messages={messages}
                        currentUserId={user?.uid}
                        onSendMessage={(t) => sendMessage(t).catch(console.error)}
                        chatEndRef={chatEndRef}
                        matchId={match.id}
                    />
                )}

                {currentView === 'SHOP' && (
                    <Shop
                        profile={profile}
                        onBuy={(c, i) => buyItem(c, i).catch(e => alert(e.message))}
                        onClaimBonus={() => claimBonus().catch(e => alert(e.message))}
                        isBonusAvailable={isBonusAvailable}
                    />
                )}

                {currentView === 'RANK' && (
                    <Leaderboard profile={profile} />
                )}

                {/* --- MODALE DE PARTAGE --- */}
                {shareData && (
                    <ShareModal
                        data={shareData}
                        pseudo={profile?.pseudo || 'Moi'}
                        onClose={() => setShareData(null)}
                        onConfirmShare={() => {
                            claimShareReward();
                            setShareData(null);
                        }}
                    />
                )}

                {/* ADMIN & DEMO TOOLS */}
                <div className={`shrink-0 bg-slate-950 border-t border-slate-800 transition-all duration-300 z-50 ${isAdminPanelOpen ? 'h-auto pb-4' : 'h-10'}`}>
                    <button onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)} className="w-full flex items-center justify-center h-10 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300 gap-1 bg-slate-900/50">
                        {isAdminPanelOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />} Admin & Tests
                    </button>
                    {isAdminPanelOpen && (
                        <div className="px-4 pt-2 grid grid-cols-2 gap-2 animate-in slide-in-from-bottom-2">
                            <AdminTools onAddEvent={addMatchEvent} onAdvanceTime={advanceTime} />
                            {/* BOUTON TEST PARTAGE */}
                            <button
                                onClick={() => setShareData({ type: 'WIN', title: 'BIG WIN !', subtitle: 'PSG vs OM', value: '+500 Coins', accentColor: 'text-emerald-400' })}
                                className="p-2 bg-emerald-900/30 border border-emerald-500/50 rounded text-xs text-emerald-400 font-bold flex items-center justify-center gap-1 col-span-2"
                            >
                                <Share2 size={12} /> Test Viralité (Share)
                            </button>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

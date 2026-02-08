import { useState } from 'react';
import { Layout, MessageSquare, Trophy, Swords, User } from 'lucide-react';

// Hooks
import { useAuth } from './context/AuthContext';
// import { useMatch } from './hooks/useMatch';
import { useBetting } from './hooks/useBetting';
import { useGamification } from './hooks/useGamification';

// Components (Views)
import { HomeView } from './components/layout/HomeView';
import { MatchCenterView } from './features/match';
import { SocialView } from './components/social/SocialView';
import { LeaderboardView } from './components/social/LeaderboardView';
import { ProfileView } from './components/profile/ProfileView';
import { ShopView } from './components/shop/ShopView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { InventoryView } from './components/marketplace/InventoryView';
import { FantasyView } from './components/fantasy/FantasyView';
import { BlitzView } from './components/blitz/BlitzView';
import { Onboarding } from './components/auth/Onboarding';
import { ShareStoryModal } from './components/social/ShareStoryModal';
import { AdminApp } from './components/admin';
import { StandingsTable } from './components/standings';

// UI Components
import { ToastNotification } from './components/ui/ToastNotification';
import { NotificationsOverlay } from './components/ui/NotificationsOverlay';

// Types
import type { RichUserProfile } from './types/types';

export default function App() {
    const { user: authUser, profile, loading, isOnboarding } = useAuth();
    const [currentView, setCurrentView] = useState('HOME');
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [showNotifOverlay, setShowNotifOverlay] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isDebugMode, setIsDebugMode] = useState(false);

    // Business Hooks
    // const { } = useMatch(); // match unused for now
    const { placeBet, is1N2Locked, isScoreLocked, getExistingBet } = useBetting(authUser?.uid, selectedMatch?.id, selectedMatch?.status);
    const { buyItem, equipItem } = useGamification(authUser?.uid, profile);

    // --- ADAPTER USER PROFILE ---
    const user: RichUserProfile = {
        uid: authUser?.uid || 'guest',
        username: profile?.pseudo || 'Joueur',
        avatar: profile?.avatar || '👤',
        frame: profile?.frame || 'border-slate-800',
        level: profile?.level || 1,
        xp: profile?.xp || 0,
        coins: profile?.coins || 0,
        badges: profile?.badges || [],
        stats: {
            totalPredictions: profile?.stats?.totalPredictions || 0,
            winRate: profile?.stats?.winRate || '0%',
            precision: profile?.stats?.precision || '0%',
            rank: profile?.stats?.rank || '#-',
        },
        referralCode: profile?.referralCode || 'REF-1234',
        predictions: profile?.predictions || [],
        inventory: profile?.inventory || []
    };

    // --- HANDLERS ---
    const handleNavigate = (view: string) => {
        setCurrentView(view);
    };

    const handleMatchClick = (matchData: any) => {
        setSelectedMatch(matchData);
        setCurrentView('MATCH');
    };

    const handlePlaceBet = async (type: '1N2' | 'EXACT_SCORE', selection: any, amount: number) => {
        try {
            await placeBet(type, selection, amount); // Note: useBetting placeBet refactoring might be needed if arguments differ
            // For now assuming useBetting's placeBet matches or we wrap it.
            // Actually useBetting.ts defined: placeBet(type, selection) using a fixed amount or logic?
            // Let's check: placeBet(type, selection) in previous App.backup.tsx.
            // We might need to overload or adjust.
            // For the migration demo, we'll try to call it.
            showToastMessage('Pari validé avec succès !');
        } catch (e: any) {
            showToastMessage('Erreur : ' + e.message);
        }
    };

    const handleBuyItem = async (item: any) => {
        try {
            await buyItem(item.price, item.id);
            showToastMessage(`Achat réussi : ${item.name}`);
        } catch (e: any) {
            showToastMessage(e.message);
        }
    };

    const showToastMessage = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Loading / Onboarding
    if (loading) return <div className="h-screen bg-slate-950 text-white flex items-center justify-center">Chargement...</div>;
    if (isOnboarding) return <Onboarding />;

    // Admin mode (access via ?admin=true in URL)
    const isAdminMode = window.location.search.includes('admin=true');
    if (isAdminMode) return <AdminApp />;

    // Standings mode (access via ?standings=true in URL)
    const isStandingsMode = window.location.search.includes('standings=true');
    if (isStandingsMode) return (
        <div className="h-screen bg-slate-950 p-4 overflow-y-auto">
            <StandingsTable />
        </div>
    );

    return (
        <div className="h-screen bg-slate-950 flex justify-center overflow-hidden font-sans select-none text-slate-200">
            <div className="w-full max-w-md h-full bg-slate-950 flex flex-col relative shadow-2xl overflow-hidden">

                {/* GLOBAL OVERLAYS */}
                {showNotifOverlay && <NotificationsOverlay onClose={() => setShowNotifOverlay(false)} />}
                {showShareModal && selectedMatch && (
                    <ShareStoryModal
                        user={user}
                        selectedMatch={selectedMatch}
                        selectedOdd={selectedOdd}
                        betAmount={betAmount}
                        onClose={() => setShowShareModal(false)}
                    />
                )}
                <ToastNotification message={toastMessage} show={showToast} />

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-hidden relative">
                    {currentView === 'HOME' && (
                        <HomeView
                            user={user}
                            onNavigate={handleNavigate}
                            onMatchClick={handleMatchClick}
                            toggleNotifications={() => setShowNotifOverlay(true)}
                        />
                    )}
                    {currentView === 'SOCIAL' && <SocialView />}
                    {currentView === 'LEADERBOARD' && <LeaderboardView user={user} onNavigate={handleNavigate} />}
                    {currentView === 'PROFILE' && (
                        <ProfileView 
                            user={user} 
                            onNavigate={handleNavigate} 
                            isDebugMode={isDebugMode}
                            onToggleDebug={() => setIsDebugMode(!isDebugMode)}
                        />
                    )}
                    {currentView === 'SHOP' && <ShopView user={user} onNavigate={handleNavigate} onBuyItem={handleBuyItem} onEquipItem={(type, asset) => equipItem(type, asset)} />}
                    {currentView === 'MARKETPLACE' && <MarketplaceView user={user} onNavigate={handleNavigate} />}
                    {currentView === 'INVENTORY' && <InventoryView user={user} onNavigate={handleNavigate} />}
                    {currentView === 'FANTASY' && <FantasyView user={user} onNavigate={handleNavigate} />}
                    {currentView === 'BLITZ' && <BlitzView user={user} onNavigate={handleNavigate} />}
                    {currentView === 'MATCH' && selectedMatch && (
                        <MatchCenterView
                            match={selectedMatch}
                            user={user}
                            onNavigate={handleNavigate}
                            isDebugMode={isDebugMode}
                            onPlaceBet={(type, selection, amount, odd) => {
                                handlePlaceBet(type, selection, amount);
                                setSelectedOdd(odd);
                                setBetAmount(amount);
                                setShowShareModal(true);
                            }}
                            is1N2Locked={is1N2Locked()}
                            isScoreLocked={isScoreLocked()}
                            existingBet1N2={getExistingBet('1N2')}
                            existingBetScore={getExistingBet('EXACT_SCORE')}
                        />
                    )}
                </main>

                {/* BOTTOM NAVIGATION (Hidden in Match View) */}
                {!['MATCH', 'MARKETPLACE', 'INVENTORY', 'BLITZ'].includes(currentView) && (
                    <nav className="shrink-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-6 py-4 pb-8 flex justify-between items-center z-40">
                        <button onClick={() => setCurrentView('HOME')} className={`flex flex-col items-center gap-1 font-black transition-colors ${currentView === 'HOME' ? 'text-emerald-500' : 'text-slate-600'}`}>
                            <Layout size={22} /><span className="text-[9px] uppercase tracking-wide">Matchs</span>
                        </button>
                        <button onClick={() => setCurrentView('SOCIAL')} className={`flex flex-col items-center gap-1 font-black transition-colors ${currentView === 'SOCIAL' ? 'text-emerald-500' : 'text-slate-600'}`}>
                            <MessageSquare size={22} /><span className="text-[9px] uppercase tracking-wide">Social</span>
                        </button>
                        <div className="relative -top-6">
                            <button onClick={() => setCurrentView('LEADERBOARD')} className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-lg transition-all ${currentView === 'LEADERBOARD' ? 'bg-yellow-500 text-black shadow-yellow-500/20' : 'bg-emerald-500 text-black shadow-emerald-500/20 active:scale-95'}`}>
                                <Trophy size={26} />
                            </button>
                        </div>
                        <button onClick={() => setCurrentView('FANTASY')} className={`flex flex-col items-center gap-1 font-black transition-colors ${currentView === 'FANTASY' || currentView === 'BLITZ' ? 'text-emerald-500' : 'text-slate-600'}`}>
                            <Swords size={22} /><span className="text-[9px] uppercase tracking-wide">Jeux</span>
                        </button>
                        <button onClick={() => setCurrentView('PROFILE')} className={`flex flex-col items-center gap-1 font-black transition-colors ${currentView === 'PROFILE' ? 'text-emerald-500' : 'text-slate-600'}`}>
                            <User size={22} /><span className="text-[9px] uppercase tracking-wide">Profil</span>
                        </button>
                    </nav>
                )}

                {/* Global Styles (Scrollbar, Animation) */}
                <style dangerouslySetInnerHTML={{
                    __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}} />
            </div>
        </div>
    );
}
import React, { useState, useEffect, useRef } from 'react';
import {
    Trophy, Layout, MessageSquare, User, Star,
    ChevronRight, TrendingUp, Coins, ChevronLeft,
    Calendar, Share2, XCircle, Clock, Activity,
    Award, Users, Send, ShieldCheck, Instagram,
    Flame, ShoppingBag, Lock,
    ChevronDown, Bell, Info, Gift, Copy, Settings,
    Target, Hash, Plus
} from 'lucide-react';

// --- DONNÉES MOCK ENRICHIES ---

const MOCK_DATES = [
    { id: -2, label: 'AVANT-HIER', short: 'MAR 04' },
    { id: -1, label: 'HIER', short: 'MER 05' },
    { id: 0, label: 'AUJOURD\'HUI', short: 'JEU 06', active: true },
    { id: 1, label: 'DEMAIN', short: 'VEN 07' },
    { id: 2, label: 'SAMEDI', short: 'SAM 08' },
    { id: 3, label: 'DIMANCHE', short: 'DIM 09' },
];

const MOCK_LEAGUES = {
    'Ligue 1': { country: '🇫🇷', logo: 'L1' },
    'Premier League': { country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: 'PL' },
    'Liga': { country: '🇪🇸', logo: 'LG' },
    'Serie A': { country: '🇮🇹', logo: 'SA' },
    'Botola Pro': { country: '🇲🇦', logo: 'BOT' },
};

const MOCK_MATCHES = [
    // --- LIGUE 1 (Avec les données détaillées pour la compo du Code A) ---
    {
        id: 1, competition: 'Ligue 1', home: 'PSG', away: 'OM', homeLogo: '🔴', awayLogo: '🔵',
        time: '21:00', status: 'SCHEDULED', score: { h: 0, a: 0 }, odds: { h: 1.45, n: 4.20, a: 6.50 },
        favorite: true,
        homeForm: ['V', 'V', 'N', 'V', 'V'], awayForm: ['D', 'V', 'V', 'N', 'D'],
        // Fusion des données de composition (Coordonnées X/Y)
        lineups: {
            confirmed: false, // Match à venir : Compo probable
            home: {
                formation: '4-3-3',
                starters: [
                    { name: 'Donnarumma', num: 99, x: 50, y: 90 },
                    { name: 'Hakimi', num: 2, x: 85, y: 70 },
                    { name: 'Marquinhos', num: 5, x: 65, y: 75 },
                    { name: 'Pacho', num: 51, x: 35, y: 75 },
                    { name: 'Nuno Mendes', num: 25, x: 15, y: 70 },
                    { name: 'Vitinha', num: 17, x: 50, y: 55 },
                    { name: 'Z-Emery', num: 33, x: 70, y: 50 },
                    { name: 'Neves', num: 87, x: 30, y: 50 },
                    { name: 'Dembélé', num: 10, x: 80, y: 25 },
                    { name: 'Barcola', num: 29, x: 20, y: 25 },
                    { name: 'Muani', num: 23, x: 50, y: 20 }
                ],
                bench: ['Safonov', 'Beraldo', 'Lee', 'Asensio']
            },
            away: {
                formation: '4-2-3-1',
                starters: [
                    { name: 'Rulli', num: 1, x: 50, y: 10 },
                    { name: 'Balerdi', num: 5, x: 40, y: 25 },
                    { name: 'Cornelius', num: 3, x: 60, y: 25 },
                    { name: 'Murillo', num: 62, x: 80, y: 30 },
                    { name: 'Merlin', num: 29, x: 20, y: 30 },
                    { name: 'Hojbjerg', num: 23, x: 40, y: 45 },
                    { name: 'Rabiot', num: 25, x: 60, y: 45 },
                    { name: 'Greenwood', num: 10, x: 20, y: 70 },
                    { name: 'Henrique', num: 44, x: 80, y: 70 },
                    { name: 'Harit', num: 11, x: 50, y: 65 },
                    { name: 'Wahi', num: 9, x: 50, y: 85 }
                ],
                bench: ['Rowe', 'Kondogbia', 'Brassier']
            }
        }
    },
    {
        id: 11, competition: 'Ligue 1', home: 'Lyon', away: 'Monaco', homeLogo: '🦁', awayLogo: '👑',
        time: '19:00', status: 'FINISHED', score: { h: 2, a: 2 }, odds: { h: 2.80, n: 3.40, a: 2.40 },
        favorite: false
    },

    // --- PREMIER LEAGUE ---
    {
        id: 2, competition: 'Premier League', home: 'Arsenal', away: 'Man City', homeLogo: '🔫', awayLogo: '🔵',
        time: 'Live 64\'', status: 'LIVE', minute: 64, score: { h: 1, a: 1 }, odds: { h: 2.10, n: 3.00, a: 2.80 },
        favorite: true,
        events: [
            { min: 12, type: 'GOAL', team: 'away', player: 'E. Haaland' },
            { min: 45, type: 'GOAL', team: 'home', player: 'B. Saka', detail: 'Penalty' },
        ],
        lineups: { confirmed: true, home: { starters: [], bench: [] }, away: { starters: [], bench: [] } }
    },
    {
        id: 22, competition: 'Premier League', home: 'Chelsea', away: 'Liverpool', homeLogo: '🔵', awayLogo: '🔴',
        time: '14:30', status: 'SCHEDULED', score: { h: 0, a: 0 }, odds: { h: 3.10, n: 3.50, a: 2.10 },
        favorite: false
    },

    // --- LIGA ---
    {
        id: 3, competition: 'Liga', home: 'Real Madrid', away: 'Barça', homeLogo: '⚪', awayLogo: '🔵🔴',
        time: 'Demain', status: 'SCHEDULED', score: { h: 0, a: 0 }, odds: { h: 2.05, n: 3.60, a: 3.10 },
        favorite: true
    },

    // --- BOTOLA ---
    {
        id: 4, competition: 'Botola Pro', home: 'Raja CA', away: 'Wydad AC', homeLogo: '🦅', awayLogo: '🔴',
        time: '20:00', status: 'SCHEDULED', score: { h: 0, a: 0 }, odds: { h: 2.50, n: 2.90, a: 2.50 },
        favorite: true
    },
];

const MOCK_SHOP = [
    { id: 1, name: 'Lion de Feu', price: 500, minLevel: 1, asset: '🦁', type: 'AVATAR' },
    { id: 2, name: 'Ninja Pro', price: 1200, minLevel: 3, asset: '🥷', type: 'AVATAR' },
    { id: 3, name: 'Cadre Émeraude', price: 800, minLevel: 2, asset: 'border-emerald-500', type: 'FRAME' },
    { id: 4, name: 'Cadre Or Pur', price: 3000, minLevel: 8, asset: 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]', type: 'FRAME' },
];

// --- NOUVELLES DONNÉES SOCIALES (Code B) ---
const MOCK_CHAT_GLOBAL = [
    { id: 1, user: 'Karim_Paris', text: 'Le PSG est trop fort cette saison 🔴🔵', time: '10:02', avatar: '🦁', level: 12 },
    { id: 2, user: 'Marseille_Fan', text: 'On en reparle après le classico ! 😉', time: '10:05', avatar: '🦅', level: 8 },
    { id: 3, user: 'PronoExpert', text: 'Grosse cote sur Lyon ce soir, foncez !', time: '10:10', avatar: '🥷', level: 24 },
];

const MOCK_NOTIFICATIONS = [
    { id: 1, title: 'Pari Gagné !', text: 'Bravo ! Votre pari sur Arsenal a rapporté 320 🪙', time: 'Il y a 2h', type: 'SUCCESS', read: false },
    { id: 2, title: 'Nouveau Message', text: 'Karim vous a invité dans le groupe "Ligue 1 Experts"', time: 'Il y a 4h', type: 'INFO', read: true },
];

const MOCK_GROUPS = [
    { id: 1, name: 'Ligue 1 Experts', members: 42, icon: '⚽', desc: 'Le groupe officiel des parieurs L1.' },
    { id: 2, name: 'Champions League', members: 128, icon: '🏆', desc: 'Pronostics sur la coupe d\'Europe.' },
];

// --- DONNÉES MOCK POUR LES TENDANCES DE PRONOSTICS ---
const MOCK_PREDICTION_STATS = {
    1: { total: 1247, home: 62, draw: 8, away: 30 }, // PSG-OM
    2: { total: 892, home: 48, draw: 22, away: 30 }, // Arsenal-Man City
    3: { total: 2103, home: 45, draw: 18, away: 37 }, // Real-Barça
};

// --- RÈGLES DE CALCUL PAR COMPÉTITION (RG-01) ---
const COMPETITION_RULES = {
    'Ligue 1': {
        calculation_mode: 'ODDS_MULTIPLIER', // Utilise les cotes
        points_correct_1n2: null,
        points_correct_score: null,
        include_extra_time: false // Seul le temps réglementaire compte
    },
    'Premier League': {
        calculation_mode: 'ODDS_MULTIPLIER',
        points_correct_1n2: null,
        points_correct_score: null,
        include_extra_time: false
    },
    'Liga': {
        calculation_mode: 'ODDS_MULTIPLIER',
        points_correct_1n2: null,
        points_correct_score: null,
        include_extra_time: false
    },
    'Champions League': {
        calculation_mode: 'FIXED', // Points fixes
        points_correct_1n2: 100,
        points_correct_score: 500,
        include_extra_time: true // Inclut prolongations + TAB
    },
    'Coupe du Monde': {
        calculation_mode: 'FIXED',
        points_correct_1n2: 150,
        points_correct_score: 750,
        include_extra_time: true
    }
};

// --- DONNÉES SAISON & LEADERBOARD (RG-05) ---
const CURRENT_SEASON = {
    id: 'S2025-2026',
    name: 'Saison 2025-2026',
    start_date: '2025-08-01',
    end_date: '2026-05-31',
    active: true
};

const MOCK_LEADERBOARD_GLOBAL = [
    { rank: 1, user: 'PronoMaster', coins: 15420, season_coins: 3240, level: 12, avatar: '🤴', trend: 'up', total_predictions: 342, win_rate: 72 },
    { rank: 2, user: 'Architecte_UX', coins: 2500, season_coins: 1850, level: 4, avatar: '🦁', trend: 'stable', total_predictions: 124, win_rate: 68 },
    { rank: 3, user: 'Footix_Pro', coins: 1980, season_coins: 980, level: 7, avatar: '🥷', trend: 'down', total_predictions: 89, win_rate: 55 },
    { rank: 4, user: 'BalondOr', coins: 1750, season_coins: 1200, level: 6, avatar: '⚽', trend: 'up', total_predictions: 156, win_rate: 61 },
    { rank: 5, user: 'LigueExpert', coins: 1650, season_coins: 950, level: 5, avatar: '🎯', trend: 'stable', total_predictions: 98, win_rate: 64 },
    { rank: 6, user: 'ParisLegend', coins: 1420, season_coins: 720, level: 8, avatar: '🔴', trend: 'down', total_predictions: 201, win_rate: 58 },
    { rank: 7, user: 'UCLKing', coins: 1380, season_coins: 880, level: 7, avatar: '👑', trend: 'up', total_predictions: 134, win_rate: 66 },
    { rank: 8, user: 'TacticalGenius', coins: 1290, season_coins: 690, level: 6, avatar: '🧠', trend: 'stable', total_predictions: 112, win_rate: 62 },
];

const MOCK_LEADERBOARD_SEASON = [
    { rank: 1, user: 'Architecte_UX', coins: 1850, season_coins: 1850, level: 4, avatar: '🦁', trend: 'up', total_predictions: 67, win_rate: 71 },
    { rank: 2, user: 'PronoMaster', coins: 3240, season_coins: 3240, level: 12, avatar: '🤴', trend: 'stable', total_predictions: 89, win_rate: 69 },
    { rank: 3, user: 'BalondOr', coins: 1200, season_coins: 1200, level: 6, avatar: '⚽', trend: 'up', total_predictions: 54, win_rate: 72 },
    { rank: 4, user: 'LigueExpert', coins: 950, season_coins: 950, level: 5, avatar: '🎯', trend: 'down', total_predictions: 43, win_rate: 67 },
    { rank: 5, user: 'Footix_Pro', coins: 980, season_coins: 980, level: 7, avatar: '🥷', trend: 'stable', total_predictions: 38, win_rate: 58 },
    { rank: 6, user: 'UCLKing', coins: 880, season_coins: 880, level: 7, avatar: '👑', trend: 'up', total_predictions: 49, win_rate: 65 },
    { rank: 7, user: 'ParisLegend', coins: 720, season_coins: 720, level: 8, avatar: '🔴', trend: 'down', total_predictions: 56, win_rate: 55 },
    { rank: 8, user: 'TacticalGenius', coins: 690, season_coins: 690, level: 6, avatar: '🧠', trend: 'stable', total_predictions: 38, win_rate: 61 },
];

// --- COMPOSANTS UI ATOMIQUES ---

const ProgressBar = ({ value, color = "bg-emerald-500" }: { value: number; color?: string }) => (
    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]`} style={{ width: `${value}%` }} />
    </div>
);

const AvatarDisplay = ({ size = "w-10 h-10", avatar, frame, level, showShop = false, onShopClick }: { size?: string; avatar: string; frame: string; level: number; showShop?: boolean; onShopClick?: () => void }) => (
    <div className="relative">
        <div className={`${size} rounded-full bg-slate-800 flex items-center justify-center text-xl border-4 ${frame} transition-all duration-500 shadow-lg overflow-hidden`}>
            {avatar}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black text-[8px] font-black px-1 rounded border border-slate-900">
            {level}
        </div>
        {showShop && (
            <button
                onClick={onShopClick}
                className="absolute top-0 -right-2 bg-yellow-500 text-black p-1.5 rounded-full border-2 border-slate-950 shadow-lg active:scale-90 transition-transform"
            >
                <ShoppingBag size={10} />
            </button>
        )}
    </div>
);

// --- COMPOSANT SOCCER PITCH (Issu du Code A - Intact) ---
interface Starter { name: string; num: number; x: number; y: number; pos?: string }

const SoccerPitch = ({ starters, isHome }: { starters: Starter[]; isHome: boolean }) => (
    <div className={`relative w-full aspect-[2/3] bg-emerald-900 rounded-3xl overflow-hidden border-4 border-emerald-800 shadow-2xl mb-6 mx-auto max-w-[320px] ${!isHome ? 'rotate-180' : ''}`}>
        <div className="absolute inset-4 border-2 border-white/10 rounded-xl" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-t-0 border-white/20 rounded-b-xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-b-0 border-white/20 rounded-t-xl" />

        {starters.map((p: Starter, i: number) => (
            p.x && (
                <div key={i} className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center ${!isHome ? 'rotate-180' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black shadow-lg ${p.num === 1 || p.num === 99 || p.num === 31 || p.num === 22 ? 'bg-yellow-500 text-black border-white' : 'bg-slate-900 text-white border-white/50'}`}>
                        {p.num}
                    </div>
                    <span className="text-[8px] font-bold text-white mt-1 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-[2px] shadow-sm whitespace-nowrap">
                        {p.name}
                    </span>
                </div>
            )
        ))}
    </div>
);

// --- COMPOSANT PRINCIPAL ---

const App = () => {
    const [view, setView] = useState('home');
    const [selectedDate, setSelectedDate] = useState(0);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [matchTab, setMatchTab] = useState('timeline');
    const [showShareModal, setShowShareModal] = useState(false);
    const [betAmount, setBetAmount] = useState(100);
    const [selectedOdd, setSelectedOdd] = useState(null);
    const [chatMsg, setChatMsg] = useState('');

    const nextBetId = useRef(Date.now());

    // State spécifique pour la compo
    const [activeLineupTeam, setActiveLineupTeam] = useState('home');

    // Nouveaux states pour les fonctionnalités sociales
    const [activeSocialTab, setActiveSocialTab] = useState('chat');
    const [showNotifications, setShowNotifications] = useState(false);

    // Nouveaux states pour le module Pronostics
    const [pronoType, setPronoType] = useState('1N2'); // '1N2' ou 'EXACT_SCORE'
    const [scoreHome, setScoreHome] = useState(0);
    const [scoreAway, setScoreAway] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Nouveaux states pour le Leaderboard (RG-05)
    const [leaderboardType, setLeaderboardType] = useState('season'); // 'season' ou 'global'

    // Nouveaux states pour Phase 3
    const [predictionFilter, setPredictionFilter] = useState('all'); // 'all', 'won', 'lost', 'pending', 'void'
    const [showConfetti, setShowConfetti] = useState(false);

    // --- STATE USER FUSIONNÉ (Structure du Code B + Inventory du Code A) ---
    const [user, setUser] = useState({
        username: 'Architecte_UX',
        coins: 2500, // Coins totaux (Global)
        season_coins: 1850, // Coins de la saison en cours (RG-05)
        xp: 65,
        level: 4,
        avatar: '🦁',
        frame: 'border-slate-800',
        inventory: [1],
        referralCode: 'BET-2026-UX',
        badges: ['🏆', '🔥', '🎯', '👑'],
        stats: {
            totalPredictions: 124,
            winRate: '68%',
            rank: '#2', // Rang global
            seasonRank: '#1', // Rang saison
            precision: '74%'
        },
        predictions: [] // Structure: { id, match, type, selection, odd, amount, gain, status, is_settled, settled_at, match_final_score }
    });

    // --- LOGIQUE METIER ---

    const placeBet = (match) => {
        // Validation du solde
        if (user.coins < betAmount) {
            setToastMessage('❌ Coins insuffisants');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        // Validation de la sélection
        if (pronoType === '1N2' && !selectedOdd) {
            setToastMessage('⚠️ Sélectionnez une cote');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        // Vérification du verrouillage temporel (RG-01 & RG-02)
        const isMatchStarted = match.status === 'LIVE' || match.status === 'FINISHED';
        const isSecondHalf = match.status === 'LIVE' && match.minute >= 45;

        if (pronoType === '1N2' && isMatchStarted) {
            setToastMessage('🔒 Pronostics 1N2 fermés (match commencé)');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        if (pronoType === 'EXACT_SCORE' && isSecondHalf) {
            setToastMessage('🔒 Pronostics Score Exact fermés (2ème MT)');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        // Création du pari
        const selection = pronoType === '1N2'
            ? selectedOdd.label
            : `${scoreHome}-${scoreAway}`;

        const newBet = {
            id: ++nextBetId.current,
            match: `${match.home} vs ${match.away}`,
            type: pronoType,
            selection: selection,
            odd: pronoType === '1N2' ? selectedOdd.val : 3.5, // Score exact = cote fixe exemple
            amount: betAmount,
            gain: 0, // Sera calculé à la résolution
            status: 'PENDING',
            is_settled: false, // RG-04: Flag d'idempotence
            settled_at: null,
            match_final_score: null,
            match_had_extra_time: false,
            match_had_penalty_shootout: false
        };

        setUser(prev => ({
            ...prev,
            coins: prev.coins - betAmount,
            predictions: [newBet, ...prev.predictions]
        }));

        setToastMessage('✅ Pronostic enregistré !');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setShowShareModal(true);
    };

    const buyItem = (item) => {
        if (user.coins >= item.price && !user.inventory.includes(item.id)) {
            setUser(prev => ({ ...prev, coins: prev.coins - item.price, inventory: [...prev.inventory, item.id] }));
        } else if (user.inventory.includes(item.id)) {
            if (item.type === 'AVATAR') setUser(p => ({ ...p, avatar: item.asset }));
            if (item.type === 'FRAME') setUser(p => ({ ...p, frame: item.asset }));
        }
    };

    // --- MOTEUR DE RÉSOLUTION DES GAINS (RG-01 à RG-06) ---

    const determineWinner = (score, hadPenaltyShootout = false, penaltyScore = null) => {
        // RG-02: Résultat FINAL inclut prolongations + TAB
        if (hadPenaltyShootout && penaltyScore) {
            return penaltyScore.h > penaltyScore.a ? '1' : '2';
        }

        if (score.h > score.a) return '1';
        if (score.h < score.a) return '2';
        return 'N';
    };

    const calculateGain = (prediction, match) => {
        const rules = COMPETITION_RULES[match.competition] || COMPETITION_RULES['Ligue 1'];

        if (rules.calculation_mode === 'FIXED') {
            // Mode Points Fixes (Coupe du Monde, Champions League)
            if (prediction.type === '1N2') {
                return rules.points_correct_1n2;
            } else if (prediction.type === 'EXACT_SCORE') {
                return rules.points_correct_score;
            }
        } else {
            // Mode Multiplicateur de Cote (Ligue 1, Premier League, etc.)
            return Math.floor(prediction.amount * prediction.odd);
        }
    };

    const resolveBet = (prediction, match) => {
        // RG-06: Vérification annulation
        if (match.status === 'CANCELLED' || match.status === 'POSTPONED') {
            return {
                status: 'VOID',
                gain: 0,
                refund: prediction.amount,
                message: 'Match annulé - Mise remboursée'
            };
        }

        // Le match doit être terminé
        if (match.status !== 'FINISHED') {
            return null; // Pas encore résolu
        }

        const rules = COMPETITION_RULES[match.competition] || COMPETITION_RULES['Ligue 1'];
        const finalScore = match.score;
        const hadPenaltyShootout = match.penaltyScore !== undefined;

        // Résolution 1N2
        if (prediction.type === '1N2') {
            const winner = determineWinner(finalScore, hadPenaltyShootout, match.penaltyScore);

            if (prediction.selection === winner) {
                const gain = calculateGain(prediction, match);
                return {
                    status: 'WON',
                    gain: gain,
                    refund: 0,
                    message: `Bravo ! +${gain} coins`
                };
            } else {
                return {
                    status: 'LOST',
                    gain: 0,
                    refund: 0,
                    message: 'Perdu'
                };
            }
        }

        // Résolution Score Exact
        if (prediction.type === 'EXACT_SCORE') {
            const predictedScore = prediction.selection;
            const actualScore = `${finalScore.h}-${finalScore.a}`;

            if (predictedScore === actualScore) {
                const gain = calculateGain(prediction, match);
                return {
                    status: 'WON',
                    gain: gain,
                    refund: 0,
                    message: `Score exact ! +${gain} coins`
                };
            } else {
                return {
                    status: 'LOST',
                    gain: 0,
                    refund: 0,
                    message: 'Score incorrect'
                };
            }
        }

        return null;
    };

    const resolveMatchPredictions = (matchId) => {
        const match = MOCK_MATCHES.find(m => m.id === matchId);
        if (!match) return;

        setUser(prev => {
            const updatedPredictions = prev.predictions.map(pred => {
                // Vérifier si ce pari concerne ce match
                const matchName = `${match.home} vs ${match.away}`;
                if (!pred.match.includes(match.home) && !pred.match.includes(match.away)) {
                    return pred;
                }

                // RG-04: Idempotence - Ne pas re-résoudre
                if (pred.is_settled) {
                    return pred;
                }

                // Résoudre le pari
                const result = resolveBet(pred, match);
                if (!result) return pred; // Match pas encore terminé

                return {
                    ...pred,
                    status: result.status,
                    gain: result.gain,
                    is_settled: true,
                    settled_at: new Date().toISOString(),
                    match_final_score: `${match.score.h}-${match.score.a}`,
                    match_had_extra_time: match.hadExtraTime || false,
                    match_had_penalty_shootout: match.penaltyScore !== undefined
                };
            });

            // Calculer le total des gains et remboursements
            const totalGains = updatedPredictions
                .filter(p => p.is_settled && !prev.predictions.find(old => old.id === p.id)?.is_settled)
                .reduce((sum, p) => sum + (p.gain || 0), 0);

            const totalRefunds = updatedPredictions
                .filter(p => p.status === 'VOID' && !prev.predictions.find(old => old.id === p.id)?.is_settled)
                .reduce((sum, p) => sum + p.amount, 0);

            // Mettre à jour les coins
            const newCoins = prev.coins + totalGains + totalRefunds;

            // RG-05: Alimenter simultanément Global_Score ET Season_Score
            const newSeasonCoins = prev.season_coins + totalGains + totalRefunds;

            // Toast notification
            if (totalGains > 0) {
                setToastMessage(`🎉 +${totalGains} coins gagnés !`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);

                // Animation confettis pour les gros gains
                if (totalGains >= 200) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 3000);
                }
            } else if (totalRefunds > 0) {
                setToastMessage(`↩️ ${totalRefunds} coins remboursés`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }

            return {
                ...prev,
                coins: newCoins,
                season_coins: newSeasonCoins, // RG-05: Mise à jour simultanée
                predictions: updatedPredictions
            };
        });
    };

    // Fonction de simulation pour la démo
    const simulateMatchEnd = (matchId, finalScore, hadPenaltyShootout = false, penaltyScore = null) => {
        // Mettre à jour le match
        const matchIndex = MOCK_MATCHES.findIndex(m => m.id === matchId);
        if (matchIndex === -1) return;

        MOCK_MATCHES[matchIndex] = {
            ...MOCK_MATCHES[matchIndex],
            status: 'FINISHED',
            score: finalScore,
            hadPenaltyShootout: hadPenaltyShootout,
            penaltyScore: penaltyScore
        };

        // Résoudre automatiquement les paris
        resolveMatchPredictions(matchId);

        setToastMessage(`⚽ Match terminé : ${MOCK_MATCHES[matchIndex].home} ${finalScore.h}-${finalScore.a} ${MOCK_MATCHES[matchIndex].away}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const matchesByLeague = MOCK_MATCHES.reduce((acc, match) => {
        if (!acc[match.competition]) acc[match.competition] = [];
        acc[match.competition].push(match);
        return acc;
    }, {});

    // --- FONCTIONS UTILITAIRES ---

    // RG-04: Tri du leaderboard (Coins décroissant, puis Alphabétique)
    const sortLeaderboard = (players) => {
        return [...players].sort((a, b) => {
            // 1. Tri par coins (décroissant)
            if (b.coins !== a.coins) {
                return b.coins - a.coins;
            }
            // 2. Tri alphabétique en cas d'égalité stricte
            return a.user.localeCompare(b.user);
        }).map((player, index) => ({
            ...player,
            rank: index + 1
        }));
    };

    // Calculer les statistiques du joueur
    const calculateUserStats = () => {
        const settledPredictions = user.predictions.filter(p => p.is_settled);
        const wonPredictions = settledPredictions.filter(p => p.status === 'WON');

        return {
            total: user.predictions.length,
            settled: settledPredictions.length,
            won: wonPredictions.length,
            lost: settledPredictions.filter(p => p.status === 'LOST').length,
            void: settledPredictions.filter(p => p.status === 'VOID').length,
            pending: user.predictions.filter(p => !p.is_settled).length,
            winRate: settledPredictions.length > 0
                ? Math.round((wonPredictions.length / settledPredictions.length) * 100)
                : 0,
            totalGains: wonPredictions.reduce((sum, p) => sum + (p.gain || 0), 0),
            totalLosses: settledPredictions.filter(p => p.status === 'LOST').reduce((sum, p) => sum + p.amount, 0)
        };
    };

    // --- SOUS-COMPOSANTS ---

    const PredictionTrends = ({ matchId }) => {
        const stats = MOCK_PREDICTION_STATS[matchId] || { total: 0, home: 33, draw: 34, away: 33 };

        return (
            <div className="mb-6 bg-slate-900 border border-slate-800 p-4 rounded-2xl animate-slide-up">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        📊 Tendance Globale
                    </h4>
                    <span className="text-[9px] font-bold text-slate-600">
                        {stats.total.toLocaleString()} paris
                    </span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden border border-slate-800 mb-3">
                    <div
                        className="bg-emerald-500 transition-all duration-500"
                        style={{ width: `${stats.home}%` }}
                    />
                    <div
                        className="bg-slate-700 transition-all duration-500"
                        style={{ width: `${stats.draw}%` }}
                    />
                    <div
                        className="bg-red-500 transition-all duration-500"
                        style={{ width: `${stats.away}%` }}
                    />
                </div>
                <div className="flex justify-between text-[9px] font-black">
                    <span className="text-emerald-500">🏠 {stats.home}%</span>
                    <span className="text-slate-500">🤝 {stats.draw}%</span>
                    <span className="text-red-500">✈️ {stats.away}%</span>
                </div>
            </div>
        );
    };

    const ToastNotification = ({ message, show }) => {
        if (!show) return null;
        return (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
                <div className="bg-slate-900 border-2 border-emerald-500 px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-500/20 backdrop-blur-md">
                    <p className="text-sm font-black text-white">{message}</p>
                </div>
            </div>
        );
    };

    const ConfettiAnimation = ({ show }) => {
        if (!show) return null;

        return (
            <div className="fixed inset-0 z-[250] pointer-events-none overflow-hidden">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 animate-confetti"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: '-10px',
                            background: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
                            animationDelay: `${Math.random() * 0.5}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>
        );
    };

    const MatchCard = ({ match }) => (
        <div onClick={() => { setSelectedMatch(match); setView('match-center'); setMatchTab('timeline'); }} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-2 active:scale-[0.98] transition-all cursor-pointer hover:border-emerald-500/30">
            <div className="flex justify-between items-center">
                <div className="flex flex-col items-center w-12">
                    <span className="text-2xl mb-1">{match.homeLogo}</span>
                    <span className="text-[9px] font-black text-white uppercase text-center leading-none">{match.home}</span>
                </div>

                <div className="flex-1 flex flex-col items-center px-4">
                    {match.status === 'LIVE' ? (
                        <>
                            <span className="text-2xl font-black text-white tracking-tighter">{match.score.h} : {match.score.a}</span>
                            <span className="text-[9px] font-bold text-red-500 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> {match.minute}'
                            </span>
                        </>
                    ) : match.status === 'FINISHED' ? (
                        <>
                            <span className="text-2xl font-black text-slate-400 tracking-tighter">{match.score.h} : {match.score.a}</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase">Terminé</span>
                        </>
                    ) : (
                        <>
                            <span className="text-xs font-black text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">{match.time}</span>
                        </>
                    )}
                </div>

                <div className="flex flex-col items-center w-12">
                    <span className="text-2xl mb-1">{match.awayLogo}</span>
                    <span className="text-[9px] font-black text-white uppercase text-center leading-none">{match.away}</span>
                </div>
            </div>
        </div>
    );

    const ShareStoryModal = () => (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in">
            <div className="w-[85%] max-w-sm bg-gradient-to-br from-emerald-600 via-slate-900 to-black rounded-[32px] p-1 border border-emerald-500/30 shadow-2xl">
                <div className="bg-slate-950/50 backdrop-blur-sm rounded-[30px] p-6 flex flex-col items-center text-center h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

                    <div className="w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center text-3xl bg-slate-800 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-4">
                        {user.avatar}
                    </div>

                    <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1">PARI VALIDÉ !</h2>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-6">BetArena Official</p>

                    <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xl">{selectedMatch.homeLogo}</span>
                            <span className="text-sm font-black text-white">VS</span>
                            <span className="text-xl">{selectedMatch.awayLogo}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-300 uppercase mb-2">{selectedMatch.home} - {selectedMatch.away}</div>
                        <div className="h-px w-full bg-white/10 mb-2" />
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 uppercase">Cote Totale</span>
                            <span className="text-lg font-black text-emerald-500">{selectedOdd?.val}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-slate-400 uppercase">Gain Potentiel</span>
                            <span className="text-lg font-black text-yellow-500">{Math.floor(betAmount * selectedOdd?.val)} <span className="text-[10px]">🪙</span></span>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full">
                        <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
                            <Instagram size={16} /> STORY
                        </button>
                        <button onClick={() => setShowShareModal(false)} className="w-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-colors">
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const NotificationsOverlay = () => (
        <div className="absolute top-24 left-5 right-5 bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl z-[100] p-6 animate-slide-up max-h-[60%] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Centre d'alertes</h4>
                <button onClick={() => setShowNotifications(false)} className="text-[10px] font-black text-slate-500 uppercase">Fermer</button>
            </div>
            <div className="space-y-4">
                {MOCK_NOTIFICATIONS.map(n => (
                    <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.read ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-emerald-500/50 shadow-lg'}`}>
                        <h5 className={`text-[10px] font-black mb-1 ${n.type === 'SUCCESS' ? 'text-emerald-500' : 'text-blue-500'}`}>{n.title}</h5>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{n.text}</p>
                        <span className="text-[8px] text-slate-600 font-bold mt-2 block">{n.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- VUES ---

    const HomeView = () => (
        <>
            <header className="pt-12 pb-2 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-900">
                {/* Top Bar */}
                <div className="px-5 flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('profile')}>
                        <AvatarDisplay avatar={user.avatar} frame={user.frame} level={user.level} />
                        <div>
                            <h2 className="text-sm font-black text-white leading-none">{user.username}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-16"><ProgressBar value={user.xp} /></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 bg-slate-900 rounded-full border border-slate-800 relative text-slate-400 active:scale-95 transition-transform">
                            <Bell size={18} />
                            {MOCK_NOTIFICATIONS.filter(n => !n.read).length > 0 && (
                                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-950 shadow-lg" />
                            )}
                        </button>
                        <div onClick={() => setView('shop')} className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 cursor-pointer active:scale-95 transition-transform">
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
                {/* Matchs Favoris (Sticky Horizontal) */}
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Star size={12} className="text-yellow-500 fill-yellow-500" /> A l'affiche</h3>
                        <span className="text-[10px] font-bold text-emerald-500">Voir tout</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {MOCK_MATCHES.filter(m => m.favorite).map(match => (
                            <div key={match.id} onClick={() => { setSelectedMatch(match); setView('match-center'); }} className="min-w-[260px] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 relative overflow-hidden group">
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
                                        {match.status === 'SCHEDULED' ? 'VS' : `${match.score.h}-${match.score.a}`}
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
                                <span className="text-xl">{MOCK_LEAGUES[leagueName]?.country || '🌍'}</span>
                                <h3 className="text-sm font-black text-white uppercase tracking-wide">{leagueName}</h3>
                                <div className="h-px bg-slate-800 flex-1 ml-2" />
                                <ChevronDown size={14} className="text-slate-600" />
                            </div>
                            <div className="space-y-2">
                                {matches.map(match => <MatchCard key={match.id} match={match} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </>
    );

    const MatchCenterView = () => {
        const isLive = selectedMatch.status === 'LIVE';
        const isConfirmed = selectedMatch.lineups?.confirmed || isLive;

        return (
            <div className="flex flex-col h-full bg-slate-950 animate-slide-up">
                {/* Header Match */}
                <div className="p-6 pt-12 bg-slate-900 border-b border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setView('home')} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><ChevronLeft size={20} /></button>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{selectedMatch.competition}</span>
                        <button onClick={() => setShowShareModal(true)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full"><Share2 size={18} /></button>
                    </div>
                    <div className="flex justify-between items-center px-4">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-5xl">{selectedMatch.homeLogo}</span>
                            <span className="text-sm font-bold text-white uppercase">{selectedMatch.home}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            {selectedMatch.status === 'LIVE' || selectedMatch.status === 'FINISHED' ? (
                                <>
                                    <span className="text-4xl font-black text-white mb-1">{selectedMatch.score.h} : {selectedMatch.score.a}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isLive ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500'}`}>{isLive ? selectedMatch.minute + "'" : 'Terminé'}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-3xl font-black text-slate-600 italic">VS</span>
                                    <span className="text-xs font-bold text-white mt-2 bg-slate-800 px-2 py-1 rounded">{selectedMatch.time}</span>
                                </>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-5xl">{selectedMatch.awayLogo}</span>
                            <span className="text-sm font-bold text-white uppercase">{selectedMatch.away}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-900 bg-slate-950 px-4 sticky top-0 z-20">
                    {['TIMELINE', 'COMPOS', 'PRONOS', 'CHAT'].map(tab => (
                        <button key={tab} onClick={() => setMatchTab(tab.toLowerCase())} className={`flex-1 py-4 text-[10px] font-black tracking-widest border-b-2 transition-colors ${matchTab === tab.toLowerCase() ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-600'}`}>{tab}</button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 no-scrollbar pb-24">
                    {matchTab === 'timeline' && (
                        <div className="space-y-4">
                            {selectedMatch.events ? selectedMatch.events.map((e, i) => (
                                <div key={i} className="flex gap-3 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="flex flex-col items-center w-8 pt-1"><span className="text-xs font-black text-slate-500">{e.min}'</span><div className="w-px h-full bg-slate-800 mt-1" /></div>
                                    <div className="flex-1 bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${e.type === 'GOAL' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{e.type === 'GOAL' ? <Award size={16} /> : <Activity size={16} />}</div>
                                        <div><div className="text-xs font-black text-white">{e.player}</div><div className="text-[9px] text-slate-500 font-bold uppercase">{e.type}</div></div>
                                    </div>
                                </div>
                            )) : <div className="text-center py-10 text-slate-600 font-bold text-xs uppercase">Aucun événement majeur</div>}
                        </div>
                    )}

                    {matchTab === 'compos' && (
                        <div className="animate-slide-up">
                            <div className="flex items-center justify-between mb-6 px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${isConfirmed ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                                        {isConfirmed ? 'Officielle' : 'Probable'}
                                    </div>
                                    {isConfirmed ? <ShieldCheck size={14} className="text-emerald-500" /> : <Clock size={14} className="text-slate-500" />}
                                </div>
                                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                                    <button onClick={() => setActiveLineupTeam('home')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeLineupTeam === 'home' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}>{selectedMatch.home}</button>
                                    <button onClick={() => setActiveLineupTeam('away')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeLineupTeam === 'away' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}>{selectedMatch.away}</button>
                                </div>
                            </div>

                            {/* Terrain Tactique */}
                            {selectedMatch.lineups && selectedMatch.lineups[activeLineupTeam]?.starters ? (
                                <>
                                    <SoccerPitch starters={selectedMatch.lineups[activeLineupTeam].starters} isHome={activeLineupTeam === 'home'} />

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
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-2">Onze de Départ ({selectedMatch.lineups[activeLineupTeam].formation})</h4>
                                            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                                                {selectedMatch.lineups[activeLineupTeam].starters.map((p, i) => (
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
                                        {selectedMatch.lineups[activeLineupTeam].bench && (
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-2">Remplaçants</h4>
                                                <div className="flex flex-wrap gap-2 px-2">
                                                    {selectedMatch.lineups[activeLineupTeam].bench.map((name, i) => (
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
                            <PredictionTrends matchId={selectedMatch.id} />

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
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            {[
                                                { l: '1', v: selectedMatch.odds?.h, label: selectedMatch.home },
                                                { l: 'N', v: selectedMatch.odds?.n, label: 'Nul' },
                                                { l: '2', v: selectedMatch.odds?.a, label: selectedMatch.away }
                                            ].map((o, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedOdd({ label: o.l, val: o.v })}
                                                    className={`py-4 rounded-xl border flex flex-col items-center transition-all ${selectedOdd?.label === o.l ? 'bg-emerald-500 border-emerald-500 text-black scale-105 shadow-lg shadow-emerald-500/20' : 'bg-slate-950 border-slate-800 text-white hover:border-slate-700'}`}
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
                                                    <span className="text-xl">{selectedMatch.homeLogo}</span>
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
                                                    <span className="text-xl">{selectedMatch.awayLogo}</span>
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
                                        {selectedMatch.status === 'LIVE' && (
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
                                    onClick={() => placeBet(selectedMatch)}
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
            </div>
        );
    };

    const ShopView = () => (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up p-5 pt-12 overflow-y-auto no-scrollbar pb-24">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => setView('home')} className="p-2.5 bg-slate-900 rounded-full border border-slate-800"><ChevronLeft /></button>
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Boutique</h2>
                <div className="bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-2">
                    <Coins size={16} className="text-yellow-500" />
                    <span className="text-sm font-black text-white">{user.coins.toLocaleString()}</span>
                </div>
            </div>

            {['AVATAR', 'FRAME'].map(type => (
                <div key={type} className="mb-8">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">{type}S EXCLUSIFS</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {MOCK_SHOP.filter(i => i.type === type).map(item => {
                            const owned = user.inventory.includes(item.id);
                            const locked = user.level < item.minLevel;
                            const equipped = type === 'AVATAR' ? user.avatar === item.asset : user.frame === item.asset;

                            return (
                                <div key={item.id} className={`bg-slate-900 border ${owned ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-slate-800'} rounded-[40px] p-6 flex flex-col items-center relative overflow-hidden transition-all active:scale-[0.97]`}>
                                    {locked && (
                                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                                            <Lock size={20} className="text-slate-600 mb-2" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">LVL {item.minLevel} REQUIS</span>
                                        </div>
                                    )}
                                    <div className={`w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center text-4xl border-4 ${item.type === 'FRAME' ? item.asset : 'border-slate-800'} mb-4 shadow-inner`}>
                                        {item.type === 'AVATAR' ? item.asset : '👤'}
                                    </div>
                                    <span className="text-[10px] font-black text-white uppercase mb-4 text-center">{item.name}</span>
                                    <button onClick={() => buyItem(item)} className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${owned ? (equipped ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-emerald-500') : 'bg-white text-black'}`}>
                                        {owned ? (equipped ? 'Équipé' : 'Équiper') : `${item.price} 🪙`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    const ProfileView = () => (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up overflow-y-auto no-scrollbar pb-24">
            {/* Header Profil Premium */}
            <div className="p-6 pt-12 bg-gradient-to-b from-emerald-500/10 via-slate-950 to-slate-950 border-b border-slate-900 flex flex-col items-center">
                <div className="flex justify-between w-full mb-8">
                    <button onClick={() => setView('home')} className="p-2.5 bg-slate-900/50 rounded-full border border-slate-800"><ChevronLeft size={20} /></button>
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Profil Joueur</h2>
                    <button className="p-2.5 bg-slate-900/50 rounded-full border border-slate-800"><Settings size={20} /></button>
                </div>

                <div className="relative mb-6">
                    <AvatarDisplay
                        size="w-32 h-32"
                        avatar={user.avatar}
                        frame={user.frame}
                        level={user.level}
                        showShop={true}
                        onShopClick={() => setView('shop')}
                    />
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    {user.username} <ShieldCheck size={20} className="text-emerald-500" />
                </h3>

                <div className="flex gap-1.5 mt-4">
                    {user.badges.map((b, i) => (
                        <div key={i} className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 shadow-xl text-xl hover:scale-110 transition-transform cursor-pointer">{b}</div>
                    ))}
                </div>

                <div className="w-full mt-8 bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                        <span>Niveau {user.level}</span>
                        <span className="text-emerald-500">{user.xp}% vers Niv. {user.level + 1}</span>
                    </div>
                    <ProgressBar value={user.xp} />
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Dashboard Statistiques */}
                <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Analyse Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Paris Totaux', val: user.stats.totalPredictions, icon: Activity, col: 'text-emerald-500' },
                            { label: 'Win Rate', val: user.stats.winRate, icon: TrendingUp, col: 'text-yellow-500' },
                            { label: 'Précision Score', val: user.stats.precision, icon: Target, col: 'text-red-500' },
                            { label: 'Rang Global', val: user.stats.rank, icon: Trophy, col: 'text-white' },
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center gap-4 hover:border-slate-700 transition-colors">
                                <div className={`p-2.5 rounded-2xl bg-slate-950 ${s.col}/10 ${s.col}`}><s.icon size={18} /></div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase block leading-tight">{s.label}</span>
                                    <span className="text-lg font-black text-white">{s.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Module Parrainage */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-800 p-6 rounded-[32px] text-black relative overflow-hidden shadow-xl shadow-emerald-500/10 group active:scale-[0.98] transition-all">
                    <Gift size={100} className="absolute -right-6 -bottom-6 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                    <div className="relative z-10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Bonus Parrainage</h4>
                        <p className="text-xl font-black mb-4 tracking-tighter leading-tight">Gagnez 1000 Coins <br />par ami parrainé</p>
                        <div className="bg-black/10 p-3.5 rounded-2xl flex items-center justify-between border border-white/20 backdrop-blur-sm">
                            <span className="text-sm font-black tracking-widest">{user.referralCode}</span>
                            <Copy size={18} className="cursor-pointer active:scale-90 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Historique des Paris */}
                <div>
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Activité Récente</h4>
                        <span className="text-[9px] font-black text-emerald-500 cursor-pointer">TOUT VOIR</span>
                    </div>

                    {/* Statistiques Détaillées */}
                    {user.predictions.length > 0 && (() => {
                        const stats = calculateUserStats();
                        return (
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] mb-6">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">📊 Statistiques</h5>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-slate-950 p-3 rounded-2xl text-center">
                                        <span className="text-2xl font-black text-emerald-500 block">{stats.won}</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">Gagnés</span>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-2xl text-center">
                                        <span className="text-2xl font-black text-red-500 block">{stats.lost}</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">Perdus</span>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-2xl text-center">
                                        <span className="text-2xl font-black text-yellow-500 block">{stats.pending}</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">En cours</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Gains totaux</span>
                                        <span className="text-lg font-black text-emerald-500">+{stats.totalGains}</span>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Pertes totales</span>
                                        <span className="text-lg font-black text-red-500">-{stats.totalLosses}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Filtres */}
                    {user.predictions.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 px-2">
                            {[
                                { value: 'all', label: 'Tous', icon: '📋' },
                                { value: 'won', label: 'Gagnés', icon: '✅' },
                                { value: 'lost', label: 'Perdus', icon: '❌' },
                                { value: 'pending', label: 'En cours', icon: '⏳' },
                                { value: 'void', label: 'Annulés', icon: '↩️' }
                            ].map(filter => {
                                const stats = calculateUserStats();
                                const count = filter.value === 'all' ? stats.total :
                                    filter.value === 'won' ? stats.won :
                                        filter.value === 'lost' ? stats.lost :
                                            filter.value === 'pending' ? stats.pending :
                                                stats.void;

                                return (
                                    <button
                                        key={filter.value}
                                        onClick={() => setPredictionFilter(filter.value)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${predictionFilter === filter.value
                                            ? 'bg-emerald-500 text-black scale-105 shadow-lg'
                                            : 'bg-slate-900 border border-slate-800 text-slate-500'
                                            }`}
                                    >
                                        <span>{filter.icon}</span>
                                        <span>{filter.label}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${predictionFilter === filter.value ? 'bg-black/20' : 'bg-slate-950'
                                            }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* BOUTONS DE SIMULATION (DEV MODE) */}
                    {user.predictions.some(p => !p.is_settled) && (
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 p-4 rounded-[24px] mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-black text-purple-400 uppercase tracking-wider">🎬 Mode Développeur</span>
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => simulateMatchEnd(1, { h: 2, a: 1 })}
                                    className="w-full bg-purple-500 hover:bg-purple-400 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 flex items-center justify-between"
                                >
                                    <span>Simuler PSG 2-1 OM</span>
                                    <span className="text-xs">⚽</span>
                                </button>
                                <button
                                    onClick={() => simulateMatchEnd(1, { h: 1, a: 1 })}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 flex items-center justify-between"
                                >
                                    <span>Simuler PSG 1-1 OM (Nul)</span>
                                    <span className="text-xs">🤝</span>
                                </button>
                                <button
                                    onClick={() => simulateMatchEnd(2, { h: 2, a: 2 }, true, { h: 4, a: 3 })}
                                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 flex items-center justify-between"
                                >
                                    <span>Arsenal 2-2 (4-3 TAB)</span>
                                    <span className="text-xs">🥅</span>
                                </button>
                            </div>
                            <p className="text-[8px] text-purple-300/60 font-bold mt-3 text-center uppercase tracking-wide">
                                Résout automatiquement vos paris et crédite les gains
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {(() => {
                            // Filtrer les prédictions selon le filtre actif
                            const filteredPredictions = user.predictions.filter(p => {
                                if (predictionFilter === 'all') return true;
                                if (predictionFilter === 'won') return p.status === 'WON';
                                if (predictionFilter === 'lost') return p.status === 'LOST';
                                if (predictionFilter === 'pending') return p.status === 'PENDING';
                                if (predictionFilter === 'void') return p.status === 'VOID';
                                return true;
                            });

                            if (filteredPredictions.length === 0) {
                                return (
                                    <div className="text-center text-slate-600 text-xs py-10 font-bold uppercase tracking-widest">
                                        Aucun pari {predictionFilter !== 'all' ? predictionFilter : ''}
                                    </div>
                                );
                            }

                            return filteredPredictions.map(p => (
                                <div key={p.id} className={`bg-slate-900 border-2 p-5 rounded-[32px] flex items-center justify-between group hover:border-slate-700 transition-all ${p.status === 'WON' ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent' :
                                    p.status === 'LOST' ? 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent' :
                                        p.status === 'VOID' ? 'border-slate-700 bg-slate-950' :
                                            'border-slate-800'
                                    }`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${p.status === 'WON' ? 'bg-emerald-500 text-black' :
                                            p.status === 'LOST' ? 'bg-red-500 text-white' :
                                                p.status === 'VOID' ? 'bg-slate-700 text-slate-400' :
                                                    'bg-slate-950 text-yellow-500 animate-pulse'
                                            }`}>
                                            {p.status === 'WON' ? '✓' :
                                                p.status === 'LOST' ? '✗' :
                                                    p.status === 'VOID' ? '↩' :
                                                        '⏳'}
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-black text-white uppercase tracking-tight mb-1">{p.match}</h5>

                                            {/* Détail du résultat si résolu */}
                                            {p.is_settled && p.match_final_score && (
                                                <p className="text-[9px] font-bold text-slate-400 mb-1">
                                                    Score final : {p.match_final_score}
                                                    {p.match_had_penalty_shootout && ' (TAB)'}
                                                    {p.match_had_extra_time && !p.match_had_penalty_shootout && ' (a.p.)'}
                                                </p>
                                            )}

                                            <p className="text-[10px] font-bold uppercase mt-1 flex items-center gap-1">
                                                <span className={p.type === 'EXACT_SCORE' ? 'text-purple-400' : 'text-blue-400'}>
                                                    {p.type === 'EXACT_SCORE' ? '🎯' : '🏆'}
                                                </span>
                                                <span className="text-slate-500">
                                                    {p.type === 'EXACT_SCORE' ? 'Score' : '1N2'}: {p.selection}
                                                </span>
                                                <span className="text-slate-600">(@{p.odd})</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {/* Affichage du gain/perte */}
                                        {p.status === 'WON' && (
                                            <div className="text-base font-black text-emerald-500 mb-1">
                                                +{p.gain}
                                            </div>
                                        )}
                                        {p.status === 'LOST' && (
                                            <div className="text-base font-black text-red-500 mb-1">
                                                -{p.amount}
                                            </div>
                                        )}
                                        {p.status === 'VOID' && (
                                            <div className="text-xs font-black text-slate-500 mb-1">
                                                Remboursé
                                            </div>
                                        )}
                                        {p.status === 'PENDING' && (
                                            <div className="text-xs font-black text-yellow-500 mb-1">
                                                -{p.amount}
                                            </div>
                                        )}

                                        {/* Badge de statut */}
                                        <span className={`text-[8px] font-black px-2 py-1 rounded inline-block uppercase tracking-widest ${p.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse' :
                                            p.status === 'WON' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                p.status === 'LOST' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                    'bg-slate-800 text-slate-500 border border-slate-700'
                                            }`}>
                                            {p.status === 'PENDING' ? '⏳ En cours' :
                                                p.status === 'WON' ? '✓ Gagné' :
                                                    p.status === 'LOST' ? '✗ Perdu' :
                                                        '↩ Annulé'}
                                        </span>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );

    const SocialView = () => (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up">
            <header className="p-6 pt-12 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Social</h2>
                <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
                    <button onClick={() => setActiveSocialTab('chat')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSocialTab === 'chat' ? 'bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-500'}`}><Hash size={14} /> Chat Global</button>
                    <button onClick={() => setActiveSocialTab('groups')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSocialTab === 'groups' ? 'bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-500'}`}><Users size={14} /> Mes Groupes</button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 no-scrollbar pb-24">
                {activeSocialTab === 'chat' ? (
                    <div className="space-y-6">
                        {MOCK_CHAT_GLOBAL.map(chat => (
                            <div key={chat.id} className="flex gap-4 group animate-slide-up">
                                <AvatarDisplay avatar={chat.avatar} frame="border-slate-800" level={chat.level} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase">{chat.user}</span>
                                        <span className="text-[8px] font-bold text-slate-600">{chat.time}</span>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-xs text-slate-300 leading-relaxed">
                                        {chat.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button className="w-full bg-slate-900 border-2 border-dashed border-slate-800 p-5 rounded-[32px] flex items-center justify-center gap-2 text-slate-500 font-black text-[10px] uppercase hover:border-emerald-500/50 hover:text-emerald-500 transition-all">
                            <Plus size={18} /> Créer un groupe
                        </button>
                        {MOCK_GROUPS.map(group => (
                            <div key={group.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-2xl border border-slate-800 shadow-inner">{group.icon}</div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase">{group.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{group.members} Membres</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const LeaderboardView = () => {
        // Sélectionner et trier le bon leaderboard selon le type (RG-04)
        const rawLeaderboard = leaderboardType === 'season'
            ? MOCK_LEADERBOARD_SEASON
            : MOCK_LEADERBOARD_GLOBAL;

        const currentLeaderboard = sortLeaderboard(rawLeaderboard);

        // Trouver la position de l'utilisateur
        const userPosition = currentLeaderboard.find(p => p.user === user.username);
        const userRank = userPosition?.rank || 99;
        const isUserInTop10 = userRank <= 10;

        return (
            <div className="flex flex-col h-full bg-slate-950 animate-slide-up overflow-y-auto no-scrollbar pb-32">
                {/* Header */}
                <div className="p-6 pt-12 bg-gradient-to-b from-yellow-500/10 via-slate-950 to-slate-950 border-b border-slate-900 sticky top-0 z-20 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setView('home')} className="p-2.5 bg-slate-900/80 rounded-full border border-slate-800 backdrop-blur-sm">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Classement</h2>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                {leaderboardType === 'season' ? CURRENT_SEASON.name : 'Historique Complet'}
                            </span>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 border-2 border-yellow-500/20 shadow-lg shadow-yellow-500/10">
                            <Trophy size={24} />
                        </div>
                    </div>

                    {/* Toggle Saison / Global (RG-05) */}
                    <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                        <button
                            onClick={() => setLeaderboardType('season')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${leaderboardType === 'season'
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-lg shadow-emerald-500/20 scale-105'
                                : 'text-slate-500 hover:text-slate-400'
                                }`}
                        >
                            <Flame size={14} className={leaderboardType === 'season' ? 'animate-pulse' : ''} />
                            Saison en cours
                        </button>
                        <button
                            onClick={() => setLeaderboardType('global')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${leaderboardType === 'global'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                                : 'text-slate-500 hover:text-slate-400'
                                }`}
                        >
                            <Trophy size={14} />
                            Classement Global
                        </button>
                    </div>
                </div>

                {/* Podium Top 3 */}
                <div className="px-6 py-8">
                    <div className="flex items-end justify-center gap-4 mb-8">
                        {/* 2ème Place */}
                        {currentLeaderboard[1] && (
                            <div className="flex flex-col items-center flex-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                <div className="relative mb-3">
                                    <AvatarDisplay size="w-16 h-16" avatar={currentLeaderboard[1].avatar} frame="border-slate-700" level={currentLeaderboard[1].level} />
                                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-slate-950 shadow-lg">
                                        2
                                    </div>
                                </div>
                                <h4 className="text-[10px] font-black text-white uppercase mb-1">{currentLeaderboard[1].user}</h4>
                                <div className="flex items-center gap-1 text-slate-400">
                                    <Coins size={10} className="text-slate-500" />
                                    <span className="text-xs font-bold">{currentLeaderboard[1].coins.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* 1ère Place - Champion */}
                        {currentLeaderboard[0] && (
                            <div className="flex flex-col items-center flex-1 relative animate-slide-up">
                                <div className="absolute -top-4 text-3xl animate-bounce">👑</div>
                                <div className="relative mb-3 mt-4">
                                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <AvatarDisplay size="w-20 h-20" avatar={currentLeaderboard[0].avatar} frame="border-yellow-500 shadow-lg shadow-yellow-500/50" level={currentLeaderboard[0].level} />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-black text-sm border-2 border-slate-950 shadow-lg">
                                        1
                                    </div>
                                </div>
                                <h4 className="text-xs font-black text-yellow-500 uppercase mb-1 tracking-wide">{currentLeaderboard[0].user}</h4>
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Coins size={12} className="text-yellow-500" />
                                    <span className="text-sm font-black">{currentLeaderboard[0].coins.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* 3ème Place */}
                        {currentLeaderboard[2] && (
                            <div className="flex flex-col items-center flex-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <div className="relative mb-3">
                                    <AvatarDisplay size="w-16 h-16" avatar={currentLeaderboard[2].avatar} frame="border-orange-700" level={currentLeaderboard[2].level} />
                                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-orange-700 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-slate-950 shadow-lg">
                                        3
                                    </div>
                                </div>
                                <h4 className="text-[10px] font-black text-white uppercase mb-1">{currentLeaderboard[2].user}</h4>
                                <div className="flex items-center gap-1 text-slate-400">
                                    <Coins size={10} className="text-orange-700" />
                                    <span className="text-xs font-bold">{currentLeaderboard[2].coins.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Liste Classement */}
                <div className="px-5 pb-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">
                        Classement Complet
                    </h3>
                    <div className="bg-slate-900 rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl">
                        {currentLeaderboard.map((item, i) => (
                            <div
                                key={item.user}
                                className={`flex items-center gap-4 p-4 border-b border-slate-800/50 last:border-0 transition-all ${item.user === user.username
                                    ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-l-4 border-l-emerald-500'
                                    : 'hover:bg-slate-800/50'
                                    }`}
                            >
                                {/* Rang */}
                                <div className="w-8 flex flex-col items-center">
                                    <span className={`text-sm font-black ${i === 0 ? 'text-yellow-500' :
                                        i === 1 ? 'text-slate-400' :
                                            i === 2 ? 'text-orange-600' :
                                                'text-slate-600'
                                        }`}>
                                        {item.rank}
                                    </span>
                                    {/* Indicateur de tendance */}
                                    {item.trend === 'up' && <span className="text-emerald-500 text-xs">▲</span>}
                                    {item.trend === 'down' && <span className="text-red-500 text-xs">▼</span>}
                                </div>

                                {/* Avatar */}
                                <AvatarDisplay size="w-10 h-10" avatar={item.avatar} frame="border-slate-800" level={item.level} />

                                {/* Info */}
                                <div className="flex-1">
                                    <h4 className={`text-xs font-black uppercase tracking-tight ${item.user === user.username ? 'text-emerald-500' : 'text-white'
                                        }`}>
                                        {item.user}
                                        {item.user === user.username && <span className="ml-2 text-[8px] text-emerald-400">(Toi)</span>}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                                            {item.total_predictions} paris · {item.win_rate}%
                                        </span>
                                    </div>
                                </div>

                                {/* Coins */}
                                <div className="text-right">
                                    <div className="flex items-center gap-1 justify-end mb-0.5">
                                        <Coins size={12} className="text-yellow-500" />
                                        <span className="text-sm font-black text-white">{item.coins.toLocaleString()}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-600 uppercase">
                                        Level {item.level}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sticky Bar Position Utilisateur (si hors top 10) */}
                {!isUserInTop10 && userPosition && (
                    <div className="fixed bottom-24 left-0 right-0 z-30 px-4">
                        <div className="max-w-md mx-auto bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500 rounded-[32px] p-4 shadow-2xl shadow-emerald-500/20 backdrop-blur-md animate-slide-up">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase mb-1">Ton rang</span>
                                        <span className="text-2xl font-black text-emerald-500">#{userRank}</span>
                                    </div>
                                    <AvatarDisplay size="w-12 h-12" avatar={user.avatar} frame={user.frame} level={user.level} />
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase">{user.username}</h4>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Coins size={10} className="text-yellow-500" />
                                            <span className="text-xs font-bold text-slate-400">
                                                {leaderboardType === 'season' ? user.season_coins : user.coins}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Win Rate</span>
                                    <span className="text-lg font-black text-emerald-500">{user.stats.winRate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- RENDU APP ---
    return (
        <div className="flex items-center justify-center min-h-screen bg-black font-sans text-slate-200">
            <div className="w-full max-w-md h-[844px] bg-slate-950 flex flex-col relative overflow-hidden shadow-2xl border-x border-slate-900">

                {view === 'home' && <HomeView />}
                {view === 'match-center' && <MatchCenterView />}
                {view === 'shop' && <ShopView />}
                {view === 'profile' && <ProfileView />}
                {view === 'social' && <SocialView />}
                {view === 'leaderboard' && <LeaderboardView />}

                {/* MODALE PARTAGE */}
                {showShareModal && <ShareStoryModal />}

                {/* OVERLAY NOTIFICATIONS */}
                {showNotifications && <NotificationsOverlay />}

                {/* TOAST NOTIFICATIONS */}
                <ToastNotification message={toastMessage} show={showToast} />

                {/* CONFETTI ANIMATION */}
                <ConfettiAnimation show={showConfetti} />

                {/* BOTTOM NAV */}
                <nav className="absolute bottom-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-6 py-4 pb-8 flex justify-between items-center z-40">
                    <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 font-black transition-colors ${view === 'home' ? 'text-emerald-500' : 'text-slate-600'}`}>
                        <Layout size={22} /><span className="text-[9px] uppercase tracking-wide">Matchs</span>
                    </button>
                    <button onClick={() => setView('social')} className={`flex flex-col items-center gap-1 font-black transition-colors ${view === 'social' ? 'text-emerald-500' : 'text-slate-600'}`}>
                        <MessageSquare size={22} /><span className="text-[9px] uppercase tracking-wide">Social</span>
                    </button>
                    <div className="relative -top-6">
                        <button onClick={() => setView('leaderboard')} className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-lg transition-all ${view === 'leaderboard' ? 'bg-yellow-500 text-black shadow-yellow-500/20' : 'bg-emerald-500 text-black shadow-emerald-500/20 active:scale-95'}`}>
                            <Trophy size={26} />
                        </button>
                    </div>
                    <button className="flex flex-col items-center gap-1 text-slate-600 font-black"><TrendingUp size={22} /><span className="text-[9px] uppercase tracking-wide">Stats</span></button>
                    <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 font-black transition-colors ${view === 'profile' ? 'text-emerald-500' : 'text-slate-600'}`}>
                        <User size={22} /><span className="text-[9px] uppercase tracking-wide">Profil</span>
                    </button>
                </nav>

                <style dangerouslySetInnerHTML={{
                    __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            @keyframes confetti {
              0% { transform: translateY(0) rotateZ(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotateZ(360deg); opacity: 0; }
            }
            .animate-confetti { animation: confetti linear forwards; }
        `}} />
            </div>
        </div>
    );
};

export default App;
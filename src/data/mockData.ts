import { Coins, Trophy, ShoppingBag, Lock, Activity, TrendingUp, Target, Gift, Copy, Share2, Instagram, XCircle } from 'lucide-react';

// --- DONNÉES MOCK ENRICHIES ---

export const MOCK_DATES = [
    { id: -2, label: 'AVANT-HIER', short: 'MAR 04' },
    { id: -1, label: 'HIER', short: 'MER 05' },
    { id: 0, label: 'AUJOURD\'HUI', short: 'JEU 06', active: true },
    { id: 1, label: 'DEMAIN', short: 'VEN 07' },
    { id: 2, label: 'SAMEDI', short: 'SAM 08' },
    { id: 3, label: 'DIMANCHE', short: 'DIM 09' },
];

export const MOCK_LEAGUES = {
    'Ligue 1': { country: '🇫🇷', logo: 'L1' },
    'Premier League': { country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: 'PL' },
    'Liga': { country: '🇪🇸', logo: 'LG' },
    'Serie A': { country: '🇮🇹', logo: 'SA' },
    'Botola Pro': { country: '🇲🇦', logo: 'BOT' },
};

export const MOCK_MATCHES: any[] = [
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

export const MOCK_SHOP = [
    { id: 1, name: 'Lion de Feu', price: 500, minLevel: 1, asset: '🦁', type: 'AVATAR' },
    { id: 2, name: 'Ninja Pro', price: 1200, minLevel: 3, asset: '🥷', type: 'AVATAR' },
    { id: 3, name: 'Cadre Émeraude', price: 800, minLevel: 2, asset: 'border-emerald-500', type: 'FRAME' },
    { id: 4, name: 'Cadre Or Pur', price: 3000, minLevel: 8, asset: 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]', type: 'FRAME' },
];

// --- NOUVELLES DONNÉES SOCIALES (Code B) ---
export const MOCK_CHAT_GLOBAL = [
    { id: 1, user: 'Karim_Paris', text: 'Le PSG est trop fort cette saison 🔴🔵', time: '10:02', avatar: '🦁', level: 12 },
    { id: 2, user: 'Marseille_Fan', text: 'On en reparle après le classico ! 😉', time: '10:05', avatar: '🦅', level: 8 },
    { id: 3, user: 'PronoExpert', text: 'Grosse cote sur Lyon ce soir, foncez !', time: '10:10', avatar: '🥷', level: 24 },
];

export const MOCK_NOTIFICATIONS = [
    { id: 1, title: 'Pari Gagné !', text: 'Bravo ! Votre pari sur Arsenal a rapporté 320 🪙', time: 'Il y a 2h', type: 'SUCCESS', read: false },
    { id: 2, title: 'Nouveau Message', text: 'Karim vous a invité dans le groupe "Ligue 1 Experts"', time: 'Il y a 4h', type: 'INFO', read: true },
];

export const MOCK_GROUPS = [
    { id: 1, name: 'Ligue 1 Experts', members: 42, icon: '⚽', desc: 'Le groupe officiel des parieurs L1.' },
    { id: 2, name: 'Champions League', members: 128, icon: '🏆', desc: 'Pronostics sur la coupe d\'Europe.' },
];

export const MOCK_LEADERBOARD = [
    { rank: 1, user: 'PronoMaster', coins: 15420, level: 12, avatar: '🤴', trend: 'up' },
    { rank: 2, user: 'Architecte_UX', coins: 2500, level: 4, avatar: '🦁', trend: 'stable' },
    { rank: 3, user: 'Footix_Pro', coins: 1980, level: 7, avatar: '🥷', trend: 'down' },
];

// --- DONNÉES MOCK POUR LES TENDANCES DE PRONOSTICS ---
export const MOCK_PREDICTION_STATS: any = {
    1: { total: 1247, home: 62, draw: 8, away: 30 }, // PSG-OM
    2: { total: 892, home: 48, draw: 22, away: 30 }, // Arsenal-Man City
    3: { total: 2103, home: 45, draw: 18, away: 37 }, // Real-Barça
};

// --- RÈGLES DE CALCUL PAR COMPÉTITION (RG-01) ---
export const COMPETITION_RULES: any = {
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

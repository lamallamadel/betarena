import React from 'react';
import {
    Users, TrendingUp, AlertTriangle, Trophy,
    ArrowUpRight, ArrowDownRight, Coins, MessageSquare
} from 'lucide-react';

// Mock KPI data (would come from Firestore in production)
const MOCK_KPIS = {
    dau: { value: 2847, change: 12.5, trend: 'up' as const },
    revenue: { value: 145230, change: -3.2, trend: 'down' as const },
    activeBets: { value: 1289, change: 8.7, trend: 'up' as const },
    chatMessages: { value: 4521, change: 23.1, trend: 'up' as const },
};

const MOCK_ALERTS = [
    { id: 1, type: 'warning', message: "Match PSG-OM: API retourne score différent", time: "il y a 5min" },
    { id: 2, type: 'info', message: "Pic de trafic détecté (+40%)", time: "il y a 15min" },
    { id: 3, type: 'error', message: "3 signalements sur utilisateur @toxic_player", time: "il y a 1h" },
];

const MOCK_TOP_MATCHES = [
    { id: 1, teams: "PSG vs OM", bets: 342, coins: 15420 },
    { id: 2, teams: "Real vs Barça", bets: 287, coins: 12890 },
    { id: 3, teams: "Liverpool vs ManU", bets: 198, coins: 9450 },
];

interface KPICardProps {
    title: string;
    value: string | number;
    change: number;
    trend: 'up' | 'down';
    icon: React.ReactNode;
    color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon, color }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(change)}%
            </div>
        </div>
        <p className="text-slate-500 text-xs font-semibold uppercase mb-1">{title}</p>
        <p className="text-2xl font-black text-white">{value.toLocaleString()}</p>
    </div>
);

export const AdminDashboard: React.FC = () => {
    return (
        <div className="space-y-6 animate-slide-up">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Utilisateurs Actifs (DAU)"
                    value={MOCK_KPIS.dau.value}
                    change={MOCK_KPIS.dau.change}
                    trend={MOCK_KPIS.dau.trend}
                    icon={<Users size={24} className="text-white" />}
                    color="bg-indigo-600"
                />
                <KPICard
                    title="Coins en Circulation"
                    value={MOCK_KPIS.revenue.value}
                    change={MOCK_KPIS.revenue.change}
                    trend={MOCK_KPIS.revenue.trend}
                    icon={<Coins size={24} className="text-white" />}
                    color="bg-amber-600"
                />
                <KPICard
                    title="Paris Actifs"
                    value={MOCK_KPIS.activeBets.value}
                    change={MOCK_KPIS.activeBets.change}
                    trend={MOCK_KPIS.activeBets.trend}
                    icon={<Trophy size={24} className="text-white" />}
                    color="bg-emerald-600"
                />
                <KPICard
                    title="Messages Chat (24h)"
                    value={MOCK_KPIS.chatMessages.value}
                    change={MOCK_KPIS.chatMessages.change}
                    trend={MOCK_KPIS.chatMessages.trend}
                    icon={<MessageSquare size={24} className="text-white" />}
                    color="bg-violet-600"
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alerts */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Alertes Récentes
                        </h3>
                        <span className="text-xs font-bold text-slate-500 uppercase">Aujourd'hui</span>
                    </div>
                    <div className="space-y-3">
                        {MOCK_ALERTS.map(alert => (
                            <div
                                key={alert.id}
                                className={`p-3 rounded-xl border-l-4 ${alert.type === 'error' ? 'bg-red-500/10 border-red-500' :
                                        alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500' :
                                            'bg-blue-500/10 border-blue-500'
                                    }`}
                            >
                                <p className="text-sm text-slate-300">{alert.message}</p>
                                <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Matches */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-500" />
                            Top Matchs (Paris)
                        </h3>
                        <span className="text-xs font-bold text-slate-500 uppercase">Aujourd'hui</span>
                    </div>
                    <div className="space-y-3">
                        {MOCK_TOP_MATCHES.map((match, i) => (
                            <div
                                key={match.id}
                                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-black' :
                                            i === 1 ? 'bg-slate-400 text-black' :
                                                'bg-amber-700 text-white'
                                        }`}>
                                        {i + 1}
                                    </span>
                                    <span className="font-semibold text-sm text-white">{match.teams}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-400">{match.bets} paris</p>
                                    <p className="text-xs text-slate-500">{match.coins.toLocaleString()} coins</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

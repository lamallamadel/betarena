import React, { useState } from 'react';
import {
    Users, TrendingUp, AlertTriangle, Trophy,
    ArrowUpRight, ArrowDownRight, Coins, MessageSquare,
    Activity, Database, Clock, TrendingDown, Zap, DollarSign,
    Flag, Wifi
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Area, AreaChart
} from 'recharts';
import { useApiQuota } from '../../hooks/useAdmin';
import { FeatureFlagsPanel } from './FeatureFlagsPanel';
import { SyncQueuePanel } from './SyncQueuePanel';
import { MarketplaceErrorMonitor } from './MarketplaceErrorMonitor';
import { useSyncQueue } from '../../hooks/useSyncQueue';

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

const CHART_COLORS = {
    primary: '#10b981',
    secondary: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
};

export const AdminDashboard: React.FC = () => {
    const { dailyStats, currentQuota, loading: quotaLoading } = useApiQuota();
    const { jobs, apiHealth, retryJob, clearCompleted, processQueue } = useSyncQueue();
    const [activeTab, setActiveTab] = useState<'overview' | 'feature-flags' | 'sync-queue' | 'marketplace-errors'>('overview');

    // Prepare chart data
    const usageChartData = dailyStats.map(stat => ({
        date: new Date(stat.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        total: stat.total_calls,
        succès: stat.successful_calls,
        échecs: stat.failed_calls,
    }));

    const avgResponseTime = dailyStats.map(stat => ({
        date: new Date(stat.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        temps: stat.total_calls > 0 ? Math.round(stat.total_response_time / stat.total_calls) : 0,
    }));

    const successRateData = dailyStats.slice(-7).map(stat => ({
        date: new Date(stat.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        taux: stat.total_calls > 0 ? Math.round((stat.successful_calls / stat.total_calls) * 100) : 0,
    }));

    const quotaDistribution = [
        { name: 'Utilisé', value: currentQuota.used, color: CHART_COLORS.primary },
        { name: 'Restant', value: currentQuota.remaining, color: CHART_COLORS.info },
    ];

    // Calculate cost projections (free tier = 100 requests/day)
    const avgDailyCalls = dailyStats.length > 0
        ? Math.round(dailyStats.reduce((sum, s) => sum + s.total_calls, 0) / dailyStats.length)
        : 0;

    const projectedMonthlyCalls = avgDailyCalls * 30;
    const freeLimit = 100 * 30; // 100/day * 30 days
    const overageRequests = Math.max(0, projectedMonthlyCalls - freeLimit);
    
    // API-Football pricing: ~$50/month for 10K requests (avg)
    const estimatedMonthlyCost = overageRequests > 0 
        ? Math.round((overageRequests / 10000) * 50)
        : 0;

    const quotaStatus = currentQuota.usagePercent >= 90 ? 'critical' : 
                       currentQuota.usagePercent >= 70 ? 'warning' : 'good';

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-800 pb-4">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                        activeTab === 'overview'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    <Activity size={18} />
                    Vue d'ensemble
                </button>
                <button
                    onClick={() => setActiveTab('sync-queue')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 relative ${
                        activeTab === 'sync-queue'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    <Wifi size={18} />
                    File de sync
                    {jobs.filter(j => j.status === 'FAILED').length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {jobs.filter(j => j.status === 'FAILED').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('feature-flags')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                        activeTab === 'feature-flags'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    <Flag size={18} />
                    Feature Flags
                </button>
                <button
                    onClick={() => setActiveTab('marketplace-errors')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                        activeTab === 'marketplace-errors'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    <AlertTriangle size={18} />
                    Erreurs Marketplace
                </button>
            </div>

            {activeTab === 'sync-queue' ? (
                <SyncQueuePanel
                    jobs={jobs}
                    apiHealth={apiHealth}
                    onRetryJob={retryJob}
                    onClearCompleted={clearCompleted}
                    onProcessQueue={processQueue}
                />
            ) : activeTab === 'feature-flags' ? (
                <FeatureFlagsPanel />
            ) : activeTab === 'marketplace-errors' ? (
                <MarketplaceErrorMonitor />
            ) : (
                <>
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

            {/* API Quota Monitoring Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Database size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-white">API-Football Monitoring</h2>
                            <p className="text-sm text-slate-400">Suivi quota & performances en temps réel</p>
                        </div>
                    </div>
                    {!quotaLoading && (
                        <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                            quotaStatus === 'critical' ? 'bg-red-500/20 text-red-400' :
                            quotaStatus === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-emerald-500/20 text-emerald-400'
                        }`}>
                            {quotaStatus === 'critical' ? '⚠️ Critique' :
                             quotaStatus === 'warning' ? '⚡ Attention' :
                             '✓ Normal'}
                        </div>
                    )}
                </div>

                {quotaLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Activity className="animate-spin text-blue-500" size={32} />
                        <span className="ml-3 text-slate-400">Chargement des données...</span>
                    </div>
                ) : (
                    <>
                        {/* Current Quota Status */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity size={16} className="text-emerald-400" />
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Quota Utilisé</span>
                                </div>
                                <p className="text-2xl font-black text-white">{currentQuota.used}</p>
                                <p className="text-xs text-slate-500 mt-1">sur {currentQuota.limit} req/jour</p>
                            </div>

                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={16} className="text-blue-400" />
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Restant</span>
                                </div>
                                <p className="text-2xl font-black text-white">{currentQuota.remaining}</p>
                                <p className="text-xs text-slate-500 mt-1">{currentQuota.usagePercent.toFixed(1)}% utilisé</p>
                            </div>

                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={16} className="text-amber-400" />
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Moy. Quotidienne</span>
                                </div>
                                <p className="text-2xl font-black text-white">{avgDailyCalls}</p>
                                <p className="text-xs text-slate-500 mt-1">requêtes/jour</p>
                            </div>

                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={16} className="text-purple-400" />
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Coût Projeté</span>
                                </div>
                                <p className="text-2xl font-black text-white">
                                    {estimatedMonthlyCost > 0 ? `$${estimatedMonthlyCost}` : 'Gratuit'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">{projectedMonthlyCalls.toLocaleString()} req/mois</p>
                            </div>
                        </div>

                        {/* Quota Progress Bar */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-300">Utilisation Journalière</span>
                                <span className="text-sm font-bold text-white">{currentQuota.usagePercent.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${
                                        currentQuota.usagePercent >= 90 ? 'bg-gradient-to-r from-red-600 to-red-500' :
                                        currentQuota.usagePercent >= 70 ? 'bg-gradient-to-r from-amber-600 to-amber-500' :
                                        'bg-gradient-to-r from-emerald-600 to-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(currentQuota.usagePercent, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Usage Trend Chart */}
                            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-emerald-400" />
                                    Historique des Requêtes (30j)
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={usageChartData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: '1px solid #475569',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="total" 
                                            stroke={CHART_COLORS.primary} 
                                            strokeWidth={2}
                                            fill="url(#colorTotal)" 
                                            name="Total"
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="succès" 
                                            stroke={CHART_COLORS.info} 
                                            strokeWidth={2}
                                            fill="url(#colorSuccess)" 
                                            name="Succès"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Success vs Failure Chart */}
                            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Activity size={18} className="text-blue-400" />
                                    Succès vs Échecs (30j)
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={usageChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: '1px solid #475569',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                        <Bar dataKey="succès" fill={CHART_COLORS.primary} name="Succès" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="échecs" fill={CHART_COLORS.danger} name="Échecs" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Response Time Chart */}
                            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Clock size={18} className="text-amber-400" />
                                    Temps de Réponse Moyen
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={avgResponseTime}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: '1px solid #475569',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                            formatter={(value) => [`${value} ms`, 'Temps']}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="temps" 
                                            stroke={CHART_COLORS.secondary} 
                                            strokeWidth={3}
                                            dot={{ fill: CHART_COLORS.secondary, r: 4 }}
                                            name="Temps (ms)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Success Rate Pie Chart */}
                            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingDown size={18} className="text-purple-400" />
                                    Distribution Quota Actuel
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={quotaDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {quotaDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: '1px solid #475569',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Success Rate 7 Days */}
                        <div className="mt-6 bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Activity size={18} className="text-emerald-400" />
                                Taux de Succès (7 derniers jours)
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={successRateData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1e293b', 
                                            border: '1px solid #475569',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                        formatter={(value) => [`${value}%`, 'Taux de succès']}
                                    />
                                    <Bar 
                                        dataKey="taux" 
                                        fill={CHART_COLORS.primary} 
                                        name="Taux de succès (%)"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Cost Projection Alert */}
                        {estimatedMonthlyCost > 0 && (
                            <div className="mt-6 bg-amber-500/10 border border-amber-500/50 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-amber-400 mb-1">Alerte Dépassement Quota Gratuit</h4>
                                        <p className="text-sm text-slate-300">
                                            Avec une moyenne de <strong>{avgDailyCalls} requêtes/jour</strong>, vous dépasserez 
                                            le quota gratuit (100/jour). Coût estimé: <strong>${estimatedMonthlyCost}/mois</strong>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            💡 Conseil: Optimisez les appels API en utilisant le cache local et réduisez la fréquence de polling.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Two Column Layout - Alerts & Top Matches */}
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
        </>
            )}
        </div>
    );
};

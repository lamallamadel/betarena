import React, { useState, useEffect } from 'react';
import { getMarketplaceErrorStats } from '../../utils/errorTracking';
import { AlertTriangle, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  criticalErrors: number;
  rollbackCount: number;
  timeRange: string;
}

const MARKETPLACE_FUNCTIONS = [
  { id: 'buyPack', label: 'Achat Pack' },
  { id: 'listCard', label: 'Mise en vente' },
  { id: 'cancelListing', label: 'Annulation' },
  { id: 'buyMarketListing', label: 'Achat P2P' },
];

export const MarketplaceErrorMonitor: React.FC = () => {
  const [stats, setStats] = useState<Record<string, ErrorStats>>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    const newStats: Record<string, ErrorStats> = {};

    for (const func of MARKETPLACE_FUNCTIONS) {
      try {
        const data = await getMarketplaceErrorStats(func.id, timeRange);
        newStats[func.id] = data;
      } catch (error) {
        console.error(`Failed to fetch stats for ${func.id}:`, error);
        newStats[func.id] = {
          totalErrors: 0,
          errorsByType: {},
          criticalErrors: 0,
          rollbackCount: 0,
          timeRange: `${timeRange} hours`,
        };
      }
    }

    setStats(newStats);
    setLoading(false);
    setLastRefresh(new Date());
  }, [timeRange]);

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      if (active) await fetchStats();
    };
    fetch();
    return () => { active = false; };
  }, [fetchStats]);

  const getTotalErrors = () => {
    return Object.values(stats).reduce((sum, s) => sum + s.totalErrors, 0);
  };

  const getTotalCritical = () => {
    return Object.values(stats).reduce((sum, s) => sum + s.criticalErrors, 0);
  };

  const getTotalRollbacks = () => {
    return Object.values(stats).reduce((sum, s) => sum + s.rollbackCount, 0);
  };

  const getSeverityColor = (critical: number, total: number) => {
    if (critical > 0) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (total > 10) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Monitoring Marketplace</h2>
          <p className="text-sm text-slate-400">
            Dernière mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
          >
            <option value={1}>1 heure</option>
            <option value={6}>6 heures</option>
            <option value={24}>24 heures</option>
            <option value={168}>7 jours</option>
          </select>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-4 py-2 bg-emerald-500 text-white rounded font-bold text-sm hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <AlertTriangle size={16} />
            <span>Total Erreurs</span>
          </div>
          <div className="text-2xl font-bold text-white">{getTotalErrors()}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
            <AlertCircle size={16} />
            <span>Critiques</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{getTotalCritical()}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-2">
            <TrendingUp size={16} />
            <span>Rollbacks</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{getTotalRollbacks()}</div>
        </div>
      </div>

      {/* Function Details */}
      <div className="space-y-3">
        {MARKETPLACE_FUNCTIONS.map((func) => {
          const funcStats = stats[func.id];
          if (!funcStats) return null;

          const severityClass = getSeverityColor(
            funcStats.criticalErrors,
            funcStats.totalErrors
          );

          return (
            <div
              key={func.id}
              className={`bg-slate-800 border rounded-lg p-4 ${severityClass}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{func.label}</h3>
                  <p className="text-xs text-slate-400">{func.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {funcStats.totalErrors}
                  </div>
                  <div className="text-xs opacity-75">erreurs</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-slate-400">Critiques</div>
                  <div className="font-bold text-red-400">
                    {funcStats.criticalErrors}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Rollbacks</div>
                  <div className="font-bold text-yellow-400">
                    {funcStats.rollbackCount}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Types</div>
                  <div className="font-bold">
                    {Object.keys(funcStats.errorsByType).length}
                  </div>
                </div>
              </div>

              {/* Error Types Breakdown */}
              {Object.keys(funcStats.errorsByType).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">Répartition par type:</div>
                  <div className="space-y-1">
                    {Object.entries(funcStats.errorsByType)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-300 truncate flex-1">
                            {type}
                          </span>
                          <span className="font-bold ml-2">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-8 text-slate-400">
          Chargement des statistiques...
        </div>
      )}
    </div>
  );
};

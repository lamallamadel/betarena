import React, { useState } from 'react';
import { BarChart3, Users, TrendingUp } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

/**
 * Panel d'administration pour déclencher manuellement les analytics
 * Utile pour tester et visualiser les métriques Year 5
 */
export const AnalyticsPanel: React.FC = () => {
  const { trackChampionVariance, trackBottom50Retention, trackDailyAnalytics } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [matchId, setMatchId] = useState('');

  const handleTrackVariance = async () => {
    if (!matchId.trim()) {
      setResult('❌ Veuillez entrer un ID de match');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await trackChampionVariance(matchId.trim(), '1N2');
      if (data) {
        setResult(
          `✅ Variance tracké!\n` +
          `• Utilisateurs uniques: ${data.uniqueUsers}\n` +
          `• Total paris: ${data.totalBets}\n` +
          `• Score variance: ${data.varianceScore.toFixed(3)}\n` +
          `• Index concentration: ${data.concentrationIndex.toFixed(3)}`
        );
      } else {
        setResult('⚠️ Aucun pari trouvé pour ce match');
      }
    } catch (error) {
      setResult(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackRetention = async () => {
    setLoading(true);
    setResult(null);

    try {
      const data = await trackBottom50Retention();
      if (data) {
        setResult(
          `✅ Rétention trackée!\n` +
          `• Date: ${data.date}\n` +
          `• Total utilisateurs: ${data.totalUsers}\n` +
          `• Bottom 50%: ${data.bottom50Count}\n` +
          `• Actifs: ${data.activeBottom50}\n` +
          `• Taux rétention: ${data.retentionRate.toFixed(1)}%\n` +
          `• Paris moyens: ${data.avgBetsPerUser.toFixed(1)}\n` +
          `• Coins moyens: ${data.avgCoinsSpent.toFixed(0)}`
        );
      } else {
        setResult('⚠️ Aucune donnée de classement disponible');
      }
    } catch (error) {
      setResult(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackAll = async () => {
    if (!matchId.trim()) {
      setResult('❌ Veuillez entrer au moins un ID de match');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const matchIds = matchId.split(',').map(id => id.trim()).filter(id => id);
      const results = await trackDailyAnalytics(matchIds);
      setResult(
        `✅ Analytics journaliers complets!\n` +
        `• Variance trackée: ${results.championVariance} match(es)\n` +
        `• Rétention: ${results.bottom50Retention ? 'Oui' : 'Non'}\n` +
        `${results.bottom50Retention ? `• Taux rétention: ${results.bottom50Retention.retentionRate.toFixed(1)}%` : ''}`
      );
    } catch (error) {
      setResult(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 border border-purple-700">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="text-purple-300" size={32} />
          <h2 className="text-2xl font-bold text-white">Analytics Year 5</h2>
        </div>
        <p className="text-purple-200 text-sm">
          Trackez les métriques avancées pour les features futures
        </p>
      </div>

      {/* Champion Variance */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-emerald-400" size={24} />
          <h3 className="text-xl font-bold text-white">Champion Variance</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Mesure la diversité des paris pour détecter le comportement moutonnier
        </p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="ID du match (ex: match_123)"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={handleTrackVariance}
            disabled={loading}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors"
          >
            {loading ? 'Chargement...' : 'Tracker Variance'}
          </button>
        </div>
      </div>

      {/* Bottom 50% Retention */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-blue-400" size={24} />
          <h3 className="text-xl font-bold text-white">Bottom 50% Retention</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Mesure l'engagement des utilisateurs moins performants (indicateur churn)
        </p>
        <button
          onClick={handleTrackRetention}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors"
        >
          {loading ? 'Chargement...' : "Tracker Rétention (aujourd'hui)"}
        </button>
      </div>

      {/* Batch Analytics */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-yellow-400" size={24} />
          <h3 className="text-xl font-bold text-white">Analytics Journaliers</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Tracker variance + rétention en une seule fois (séparés par virgule)
        </p>
        <button
          onClick={handleTrackAll}
          disabled={loading}
          className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors"
        >
          {loading ? 'Chargement...' : 'Tracker Tous'}
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`rounded-2xl p-6 border ${
          result.startsWith('✅') ? 'bg-emerald-950 border-emerald-700' :
          result.startsWith('⚠️') ? 'bg-yellow-950 border-yellow-700' :
          'bg-red-950 border-red-700'
        }`}>
          <pre className="text-sm whitespace-pre-wrap font-mono text-white">
            {result}
          </pre>
        </div>
      )}

      {/* Info */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h4 className="text-lg font-bold text-white mb-3">ℹ️ Information</h4>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• Les données sont stockées dans Firestore sous <code className="text-emerald-400">artifacts/botola-v1/analytics/</code></li>
          <li>• Le tracking est non-bloquant (ne lance pas d'erreur en cas d'échec)</li>
          <li>• Consultez les logs console pour plus de détails</li>
          <li>• Documentation complète: <code className="text-blue-400">docs/ANALYTICS.md</code></li>
        </ul>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
    Settings, Save, RotateCcw, AlertTriangle, CheckCircle,
    Zap, Clock, Database, MessageSquare, Activity, Shield,
    Flag, TrendingUp, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { useFeatureFlags, useFeatureFlagsLogs } from '../../hooks/useAdmin';
import { useAuth } from '../../context/AuthContext';
import type { Environment, FeatureFlagsConfig } from '../../types/types';

export const FeatureFlagsPanel: React.FC = () => {
    const { user, profile } = useAuth();
    const [selectedEnv, setSelectedEnv] = useState<Environment>('dev');
    const { flags, loading, error, updateFlags, resetToDefaults } = useFeatureFlags(selectedEnv);
    const { logs, loading: logsLoading } = useFeatureFlagsLogs();
    const [localFlags, setLocalFlags] = useState<FeatureFlagsConfig>(flags);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    React.useEffect(() => {
        setLocalFlags(flags);
    }, [flags]);

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        setSaveSuccess(false);

        const userName = profile?.pseudo || 'Admin';
        const success = await updateFlags(localFlags, user.uid, userName);

        setIsSaving(false);
        if (success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const handleReset = async () => {
        if (!user) return;
        if (!confirm(`Réinitialiser tous les flags de l'environnement ${selectedEnv} aux valeurs par défaut ?`)) {
            return;
        }

        setIsSaving(true);
        const userName = profile?.pseudo || 'Admin';
        const success = await resetToDefaults(user.uid, userName);
        setIsSaving(false);

        if (success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const hasChanges = JSON.stringify(localFlags) !== JSON.stringify(flags);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Activity className="animate-spin text-emerald-500" size={32} />
                <span className="ml-3 text-slate-400">Chargement des feature flags...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Environment Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                            <Flag size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-white">Gestion des Feature Flags</h2>
                            <p className="text-sm text-slate-400">Configuration par environnement</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-lg font-semibold bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <RotateCcw size={18} />
                            Réinitialiser
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="px-4 py-2 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <Activity className="animate-spin" size={18} />
                            ) : (
                                <Save size={18} />
                            )}
                            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>

                {/* Environment Tabs */}
                <div className="flex gap-2 mt-6">
                    {(['dev', 'staging', 'prod'] as Environment[]).map((env) => (
                        <button
                            key={env}
                            onClick={() => setSelectedEnv(env)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                selectedEnv === env
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {env.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Save Success Message */}
                {saveSuccess && (
                    <div className="mt-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="text-emerald-500" size={20} />
                        <span className="text-emerald-400 font-semibold">
                            Configuration enregistrée avec succès !
                        </span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle className="text-red-500" size={20} />
                        <span className="text-red-400 font-semibold">{error}</span>
                    </div>
                )}

                {/* Changes Indicator */}
                {hasChanges && !saveSuccess && (
                    <div className="mt-4 bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle className="text-amber-500" size={20} />
                        <span className="text-amber-400 font-semibold">
                            Modifications non enregistrées
                        </span>
                    </div>
                )}
            </div>

            {/* Debug Mode Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Zap size={20} className="text-yellow-400" />
                        <h3 className="font-bold text-white">Mode Debug</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localFlags.debug_mode}
                            onChange={(e) =>
                                setLocalFlags({ ...localFlags, debug_mode: e.target.checked })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>
                <p className="text-sm text-slate-400">
                    Active les logs détaillés et les outils de développement
                </p>
            </div>

            {/* Experimental Features Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Settings size={20} className="text-blue-400" />
                    <h3 className="font-bold text-white">Fonctionnalités Expérimentales</h3>
                </div>

                <div className="space-y-3">
                    {Object.entries(localFlags.experimental_features).map(([key, value]) => (
                        <div
                            key={key}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl"
                        >
                            <div>
                                <p className="text-sm font-semibold text-white capitalize">
                                    {key.replace(/_/g, ' ')}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) =>
                                        setLocalFlags({
                                            ...localFlags,
                                            experimental_features: {
                                                ...localFlags.experimental_features,
                                                [key]: e.target.checked,
                                            },
                                        })
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sync Intervals Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Clock size={20} className="text-amber-400" />
                    <h3 className="font-bold text-white">Intervalles de Synchronisation</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Activity size={16} />
                            Polling Matchs (secondes)
                        </label>
                        <input
                            type="number"
                            min="10"
                            max="300"
                            value={localFlags.sync_intervals.match_polling_seconds}
                            onChange={(e) =>
                                setLocalFlags({
                                    ...localFlags,
                                    sync_intervals: {
                                        ...localFlags.sync_intervals,
                                        match_polling_seconds: parseInt(e.target.value) || 60,
                                    },
                                })
                            }
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <TrendingUp size={16} />
                            Refresh Leaderboard (secondes)
                        </label>
                        <input
                            type="number"
                            min="10"
                            max="300"
                            value={localFlags.sync_intervals.leaderboard_refresh_seconds}
                            onChange={(e) =>
                                setLocalFlags({
                                    ...localFlags,
                                    sync_intervals: {
                                        ...localFlags.sync_intervals,
                                        leaderboard_refresh_seconds: parseInt(e.target.value) || 30,
                                    },
                                })
                            }
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <MessageSquare size={16} />
                            Refresh Chat (secondes)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={localFlags.sync_intervals.chat_refresh_seconds}
                            onChange={(e) =>
                                setLocalFlags({
                                    ...localFlags,
                                    sync_intervals: {
                                        ...localFlags.sync_intervals,
                                        chat_refresh_seconds: parseInt(e.target.value) || 5,
                                    },
                                })
                            }
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Database size={16} />
                            Check Quota API (minutes)
                        </label>
                        <input
                            type="number"
                            min="5"
                            max="120"
                            value={localFlags.sync_intervals.api_quota_check_minutes}
                            onChange={(e) =>
                                setLocalFlags({
                                    ...localFlags,
                                    sync_intervals: {
                                        ...localFlags.sync_intervals,
                                        api_quota_check_minutes: parseInt(e.target.value) || 15,
                                    },
                                })
                            }
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* API Settings Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Database size={20} className="text-purple-400" />
                    <h3 className="font-bold text-white">Paramètres API</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-white">Activer les appels API</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Désactiver pour utiliser uniquement les données en cache
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localFlags.api_settings.enable_api_calls}
                                onChange={(e) =>
                                    setLocalFlags({
                                        ...localFlags,
                                        api_settings: {
                                            ...localFlags.api_settings,
                                            enable_api_calls: e.target.checked,
                                        },
                                    })
                                }
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-white">Activer le cache</p>
                            <p className="text-xs text-slate-400 mt-1">Réduit le nombre d'appels API</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localFlags.api_settings.enable_caching}
                                onChange={(e) =>
                                    setLocalFlags({
                                        ...localFlags,
                                        api_settings: {
                                            ...localFlags.api_settings,
                                            enable_caching: e.target.checked,
                                        },
                                    })
                                }
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">
                                Limite quotidienne d'appels
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="10000"
                                value={localFlags.api_settings.max_daily_calls}
                                onChange={(e) =>
                                    setLocalFlags({
                                        ...localFlags,
                                        api_settings: {
                                            ...localFlags.api_settings,
                                            max_daily_calls: parseInt(e.target.value) || 100,
                                        },
                                    })
                                }
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">
                                TTL du cache (minutes)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="1440"
                                value={localFlags.api_settings.cache_ttl_minutes}
                                onChange={(e) =>
                                    setLocalFlags({
                                        ...localFlags,
                                        api_settings: {
                                            ...localFlags.api_settings,
                                            cache_ttl_minutes: parseInt(e.target.value) || 60,
                                        },
                                    })
                                }
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Maintenance Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Shield size={20} className="text-red-400" />
                    <h3 className="font-bold text-white">Mode Maintenance</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-white">Activer la maintenance</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Bloque l'accès à l'application pour tous les utilisateurs
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localFlags.maintenance.enabled}
                                onChange={(e) =>
                                    setLocalFlags({
                                        ...localFlags,
                                        maintenance: {
                                            ...localFlags.maintenance,
                                            enabled: e.target.checked,
                                        },
                                    })
                                }
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    {localFlags.maintenance.enabled && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">
                                    Message de maintenance
                                </label>
                                <textarea
                                    value={localFlags.maintenance.message}
                                    onChange={(e) =>
                                        setLocalFlags({
                                            ...localFlags,
                                            maintenance: {
                                                ...localFlags.maintenance,
                                                message: e.target.value,
                                            },
                                        })
                                    }
                                    placeholder="L'application est en maintenance. Retour bientôt..."
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">
                                    Utilisateurs autorisés (UIDs, séparés par virgule)
                                </label>
                                <input
                                    type="text"
                                    value={localFlags.maintenance.allowed_users.join(', ')}
                                    onChange={(e) =>
                                        setLocalFlags({
                                            ...localFlags,
                                            maintenance: {
                                                ...localFlags.maintenance,
                                                allowed_users: e.target.value
                                                    .split(',')
                                                    .map((id) => id.trim())
                                                    .filter(Boolean),
                                            },
                                        })
                                    }
                                    placeholder="uid1, uid2, uid3"
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Change Logs Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowLogs(!showLogs)}
                >
                    <div className="flex items-center gap-3">
                        <Eye size={20} className="text-slate-400" />
                        <h3 className="font-bold text-white">Historique des Modifications</h3>
                    </div>
                    <button className="text-slate-400 hover:text-white transition-colors">
                        {showLogs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                {showLogs && (
                    <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                        {logsLoading ? (
                            <div className="text-center text-slate-400 py-4">Chargement...</div>
                        ) : logs.length === 0 ? (
                            <div className="text-center text-slate-400 py-4">
                                Aucune modification enregistrée
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-3 bg-slate-800/50 rounded-xl border-l-4 border-purple-500"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-white">
                                            {log.changed_by_name}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {log.timestamp?.toDate
                                                ? new Date(log.timestamp.toDate()).toLocaleString('fr-FR')
                                                : 'Date inconnue'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-purple-400 uppercase px-2 py-1 bg-purple-500/20 rounded">
                                            {log.environment}
                                        </span>
                                    </div>
                                    <pre className="text-xs text-slate-400 mt-2 overflow-x-auto">
                                        {JSON.stringify(log.changes, null, 2)}
                                    </pre>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                    <Activity size={20} className="text-slate-400" />
                    <h3 className="font-bold text-white">Métadonnées</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-500">Dernière modification :</span>
                        <p className="text-white font-semibold">
                            {new Date(flags.last_updated).toLocaleString('fr-FR')}
                        </p>
                    </div>
                    <div>
                        <span className="text-slate-500">Modifié par :</span>
                        <p className="text-white font-semibold">{flags.updated_by}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

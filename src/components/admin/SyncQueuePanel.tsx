import React from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import type { SyncJob, ApiHealthStatus } from '../../types/types';

interface SyncQueuePanelProps {
    jobs: SyncJob[];
    apiHealth: ApiHealthStatus;
    onRetryJob: (jobId: string) => void;
    onClearCompleted: () => void;
    onProcessQueue: () => void;
}

export const SyncQueuePanel: React.FC<SyncQueuePanelProps> = ({
    jobs,
    apiHealth,
    onRetryJob,
    onClearCompleted,
    onProcessQueue,
}) => {
    const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'RETRYING');
    const failedJobs = jobs.filter(j => j.status === 'FAILED');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle size={16} className="text-emerald-500" />;
            case 'FAILED':
                return <XCircle size={16} className="text-red-500" />;
            case 'RETRYING':
                return <RefreshCw size={16} className="text-yellow-500 animate-spin" />;
            case 'PENDING':
                return <Clock size={16} className="text-blue-500" />;
            default:
                return <Clock size={16} className="text-slate-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'FAILED':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'RETRYING':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'PENDING':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const [now, setNow] = React.useState(() => Date.now());

    React.useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatRelativeTime = (timestamp?: number) => {
        if (!timestamp) return 'N/A';
        const seconds = Math.floor((now - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h`;
    };

    return (
        <div className="space-y-6">
            {/* API Health Status */}
            <div className={`p-4 rounded-xl border ${
                apiHealth.isOnline 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-red-500/5 border-red-500/20'
            }`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {apiHealth.isOnline ? (
                            <>
                                <CheckCircle size={16} className="text-emerald-500" />
                                API En Ligne
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={16} className="text-red-500" />
                                API Hors Ligne
                            </>
                        )}
                    </h3>
                    <button
                        onClick={onProcessQueue}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                    >
                        <RefreshCw size={12} />
                        Traiter la file
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-slate-500 font-medium">Échecs consécutifs</p>
                        <p className="text-white font-bold">{apiHealth.consecutiveFailures}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 font-medium">Dernier succès</p>
                        <p className="text-white font-bold">
                            {apiHealth.lastSuccessfulCall 
                                ? formatRelativeTime(apiHealth.lastSuccessfulCall)
                                : 'N/A'
                            }
                        </p>
                    </div>
                    {apiHealth.lastError && (
                        <div className="col-span-2">
                            <p className="text-slate-500 font-medium">Dernière erreur</p>
                            <p className="text-red-400 font-mono text-[10px] leading-tight mt-1">
                                {apiHealth.lastError}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Queue Statistics */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">En attente</p>
                    <p className="text-2xl font-black text-blue-400">{pendingJobs.length}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">Échoués</p>
                    <p className="text-2xl font-black text-red-400">{failedJobs.length}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">Total</p>
                    <p className="text-2xl font-black text-white">{jobs.length}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onClearCompleted}
                    className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                    <Trash2 size={12} />
                    Supprimer les terminés
                </button>
            </div>

            {/* Jobs List */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-white mb-3">File de synchronisation</h3>
                {jobs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        Aucun job en attente
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {jobs.map(job => (
                            <div
                                key={job.id}
                                className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-2"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusIcon(job.status)}
                                            <span className="text-xs font-bold text-white">
                                                {job.type}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            {JSON.stringify(job.params)}
                                        </div>
                                    </div>
                                    {job.status === 'FAILED' && (
                                        <button
                                            onClick={() => onRetryJob(job.id)}
                                            className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold hover:bg-emerald-500/20 transition-colors"
                                        >
                                            Réessayer
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-[10px]">
                                    <div>
                                        <p className="text-slate-500">Tentatives</p>
                                        <p className="text-white font-bold">
                                            {job.attempts} / {job.maxAttempts}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Créé</p>
                                        <p className="text-white font-bold">
                                            {formatRelativeTime(job.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Prochain essai</p>
                                        <p className="text-white font-bold">
                                            {job.nextRetry && job.nextRetry > now
                                                ? `Dans ${formatRelativeTime(job.nextRetry)}`
                                                : 'Maintenant'
                                            }
                                        </p>
                                    </div>
                                </div>

                                {job.error && (
                                    <div className="pt-2 border-t border-slate-800">
                                        <p className="text-[10px] text-slate-500 mb-1">Erreur:</p>
                                        <p className="text-[10px] text-red-400 font-mono leading-tight">
                                            {job.error}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

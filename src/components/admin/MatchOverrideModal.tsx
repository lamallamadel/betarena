import React, { useState } from 'react';
import { X, AlertTriangle, Lock, RefreshCw } from 'lucide-react';

interface MatchOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string;
    matchInfo?: {
        homeTeam: string;
        awayTeam: string;
        currentScore?: { home: number; away: number };
    };
    onConfirm: (data: OverrideData) => void;
}

interface OverrideData {
    matchId: string;
    newScore: { home: number; away: number };
    lockFromApi: boolean;
    strategy: 'ROLLBACK' | 'HOUSE_LOSS';
}

export const MatchOverrideModal: React.FC<MatchOverrideModalProps> = ({
    isOpen,
    onClose,
    matchId,
    matchInfo,
    onConfirm
}) => {
    const [homeScore, setHomeScore] = useState(matchInfo?.currentScore?.home ?? 0);
    const [awayScore, setAwayScore] = useState(matchInfo?.currentScore?.away ?? 0);
    const [lockFromApi, setLockFromApi] = useState(true);
    const [strategy, setStrategy] = useState<'ROLLBACK' | 'HOUSE_LOSS'>('ROLLBACK');
    const [confirmed, setConfirmed] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!confirmed) {
            setConfirmed(true);
            return;
        }

        onConfirm({
            matchId,
            newScore: { home: homeScore, away: awayScore },
            lockFromApi,
            strategy
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg mx-4 shadow-2xl animate-slide-up">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Forcer le Résultat</h3>
                            <p className="text-xs text-slate-500">Action critique - Modification manuelle</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* Match Info */}
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <p className="text-slate-400 text-xs uppercase mb-2">Match</p>
                        <p className="font-bold text-lg text-white">
                            {matchInfo?.homeTeam || 'Équipe A'} vs {matchInfo?.awayTeam || 'Équipe B'}
                        </p>
                    </div>

                    {/* Score Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Nouveau Score</label>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">{matchInfo?.homeTeam || 'DOM'}</p>
                                <input
                                    type="number"
                                    min={0}
                                    value={homeScore}
                                    onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                                    className="w-20 h-16 bg-slate-800 border border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <span className="text-2xl font-bold text-slate-600">-</span>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">{matchInfo?.awayTeam || 'EXT'}</p>
                                <input
                                    type="number"
                                    min={0}
                                    value={awayScore}
                                    onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                                    className="w-20 h-16 bg-slate-800 border border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lock Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-slate-400" />
                            <div>
                                <p className="text-sm font-semibold text-white">Verrouiller contre API</p>
                                <p className="text-xs text-slate-500">Empêcher les mises à jour automatiques</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setLockFromApi(!lockFromApi)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${lockFromApi ? 'bg-indigo-600' : 'bg-slate-700'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${lockFromApi ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    {/* Strategy Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Stratégie de Recalcul</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setStrategy('ROLLBACK')}
                                className={`p-4 rounded-xl border transition-all text-left ${strategy === 'ROLLBACK'
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <RefreshCw size={16} className={strategy === 'ROLLBACK' ? 'text-indigo-400' : 'text-slate-400'} />
                                    <span className={`font-bold text-sm ${strategy === 'ROLLBACK' ? 'text-white' : 'text-slate-300'}`}>
                                        Rollback
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Annuler les gains erronés et payer les vrais gagnants
                                </p>
                            </button>
                            <button
                                onClick={() => setStrategy('HOUSE_LOSS')}
                                className={`p-4 rounded-xl border transition-all text-left ${strategy === 'HOUSE_LOSS'
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle size={16} className={strategy === 'HOUSE_LOSS' ? 'text-amber-400' : 'text-slate-400'} />
                                    <span className={`font-bold text-sm ${strategy === 'HOUSE_LOSS' ? 'text-white' : 'text-slate-300'}`}>
                                        House Loss
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Garder les anciens gains + payer les nouveaux
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Warning */}
                    {confirmed && (
                        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-400">Confirmation requise</p>
                                <p className="text-xs text-red-300/70 mt-1">
                                    Cette action va modifier les soldes de tous les utilisateurs ayant parié sur ce match.
                                    Cliquez à nouveau pour confirmer.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-colors ${confirmed
                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                            }`}
                    >
                        {confirmed ? '⚠️ CONFIRMER' : 'Appliquer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

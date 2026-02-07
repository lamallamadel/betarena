import React from 'react';
import { X, Trophy, Coins, Star } from 'lucide-react';
import type { BlitzEntry, BlitzTournament } from '../../types/types';

interface BlitzResultModalProps {
  entry: BlitzEntry;
  tournament: BlitzTournament;
  onClose: () => void;
}

export const BlitzResultModal: React.FC<BlitzResultModalProps> = ({ entry, tournament, onClose }) => {
  const isWinner = entry.win_amount > 0;
  const rankLabel = entry.rank === 1 ? '1er' : entry.rank === 2 ? '2ème' : entry.rank === 3 ? '3ème' : `${entry.rank}ème`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-sm rounded-2xl border p-6 text-center ${
        isWinner ? 'bg-slate-900 border-yellow-500/50' : 'bg-slate-900 border-slate-700'
      }`}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
          isWinner ? 'bg-yellow-500/20' : 'bg-slate-800'
        }`}>
          {isWinner ? <Trophy size={32} className="text-yellow-400" /> : <Star size={32} className="text-slate-500" />}
        </div>

        {/* Rank */}
        <p className="text-3xl font-black text-white mb-1">{rankLabel}</p>
        <p className="text-xs text-slate-400 mb-4">{tournament.name}</p>

        {/* Score */}
        <div className="bg-slate-800/60 rounded-xl p-3 mb-4">
          <p className="text-xs text-slate-500">Score total</p>
          <p className="text-2xl font-black text-emerald-400">{entry.total_score} pts</p>
        </div>

        {/* Gain */}
        {isWinner ? (
          <div className={`rounded-xl p-4 mb-4 ${isWinner ? 'bg-yellow-500/10 border border-yellow-500/30' : ''}`}>
            <p className="text-xs text-yellow-400 mb-1">Gain</p>
            <div className="flex items-center justify-center gap-2 text-2xl font-black text-yellow-400">
              <Coins size={24} />
              +{entry.win_amount}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 mb-4">Meilleure chance la prochaine fois !</p>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

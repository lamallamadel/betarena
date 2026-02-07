import React, { useState, useEffect } from 'react';
import { Coins, Users, Trophy, Clock } from 'lucide-react';
import type { BlitzTournament } from '../../types/types';

interface BlitzTournamentCardProps {
  tournament: BlitzTournament;
  onJoin: (id: string) => Promise<void>;
  hasEntry: boolean;
}

export const BlitzTournamentCard: React.FC<BlitzTournamentCardProps> = ({ tournament, onJoin, hasEntry }) => {
  const [countdown, setCountdown] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = tournament.start_time - Date.now();
      if (diff <= 0) { setCountdown('En cours'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [tournament.start_time]);

  const handleJoin = async () => {
    setJoining(true);
    try { await onJoin(tournament.id); } finally { setJoining(false); }
  };

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-white">{tournament.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <Clock size={12} />
            <span>Ferme dans {countdown}</span>
          </div>
        </div>
        {hasEntry && (
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            Inscrit
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Users size={12} />
          <span>{tournament.participant_count} joueurs</span>
        </div>
        <div className="flex items-center gap-1 text-yellow-400 font-bold">
          <Trophy size={12} />
          <span>{tournament.prize_pool} <Coins size={10} className="inline" /></span>
        </div>
      </div>

      {!hasEntry && tournament.status === 'OPEN' ? (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-black active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <Coins size={14} />
          {joining ? 'Inscription...' : `Participer (${tournament.entry_fee})`}
        </button>
      ) : hasEntry ? (
        <p className="text-center text-xs text-emerald-400 font-medium">Déjà inscrit — voir mon draft</p>
      ) : (
        <p className="text-center text-xs text-slate-500">Tournoi fermé</p>
      )}
    </div>
  );
};

import React, { useEffect } from 'react';
import { Trophy, Coins, Radio } from 'lucide-react';
import { useBlitz } from '../../hooks/useBlitz';
import type { BlitzTournament } from '../../types/types';

interface BlitzLeaderboardProps {
  tournament: BlitzTournament;
  userId: string;
}

export const BlitzLeaderboard: React.FC<BlitzLeaderboardProps> = ({ tournament, userId }) => {
  const { leaderboard, fetchLeaderboard } = useBlitz(userId);

  useEffect(() => {
    const unsub = fetchLeaderboard(tournament.id);
    return () => unsub();
  }, [tournament.id]);

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Trophy size={14} className="text-yellow-400" />
          Classement
        </h3>
        {tournament.status === 'LIVE' && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
            <Radio size={10} className="animate-pulse" />
            En direct
          </span>
        )}
      </div>

      {/* Prize pool */}
      <div className="px-4 py-2 bg-yellow-500/5 border-b border-slate-800 flex items-center justify-center gap-1 text-sm">
        <Coins size={14} className="text-yellow-400" />
        <span className="font-bold text-yellow-400">{tournament.prize_pool}</span>
        <span className="text-xs text-slate-500">Coins en jeu</span>
      </div>

      {/* Table */}
      <div className="divide-y divide-slate-800/50">
        <div className="grid grid-cols-4 px-4 py-2 text-[10px] text-slate-500 font-bold uppercase">
          <span>Rang</span>
          <span>Joueur</span>
          <span className="text-right">Points</span>
          <span className="text-right">Gain</span>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">Aucun résultat</p>
        ) : (
          leaderboard.map((entry, i) => {
            const isMe = entry.user_id === userId;
            return (
              <div
                key={entry.id}
                className={`grid grid-cols-4 px-4 py-2.5 text-xs items-center ${isMe ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''}`}
              >
                <span className={`font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {i + 1}
                </span>
                <span className={`font-medium truncate ${isMe ? 'text-emerald-400' : 'text-white'}`}>
                  {isMe ? 'Vous' : `Joueur ${i + 1}`}
                </span>
                <span className="text-right text-white font-bold">{entry.total_score}</span>
                <span className="text-right text-yellow-400 font-bold">
                  {entry.win_amount > 0 ? `+${entry.win_amount}` : '-'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

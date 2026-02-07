import React from 'react';
import { Crown, ArrowRightLeft, Coins } from 'lucide-react';
import type { Lineup, LineupPlayer, Formation, PlayerPosition } from '../../types/types';
import { VALID_FORMATIONS } from '../../types/types';

interface GameweekResultsProps {
  lineup: Lineup;
  players: LineupPlayer[];
  formation: Formation;
}

const getSlotPositions = (formation: Formation): { x: number; y: number; pos: PlayerPosition }[] => {
  const f = VALID_FORMATIONS[formation];
  const slots: { x: number; y: number; pos: PlayerPosition }[] = [];
  slots.push({ x: 50, y: 88, pos: 'GK' });

  const distribute = (count: number): number[] => {
    if (count === 1) return [50];
    if (count === 2) return [35, 65];
    if (count === 3) return [25, 50, 75];
    if (count === 4) return [15, 38, 62, 85];
    if (count === 5) return [10, 30, 50, 70, 90];
    return [50];
  };

  distribute(f.DEF).forEach((x) => slots.push({ x, y: 72, pos: 'DEF' }));
  distribute(f.MID).forEach((x) => slots.push({ x, y: 47, pos: 'MID' }));
  distribute(f.FWD).forEach((x) => slots.push({ x, y: 22, pos: 'FWD' }));
  return slots;
};

export const GameweekResults: React.FC<GameweekResultsProps> = ({ lineup, players, formation }) => {
  const slotPositions = getSlotPositions(formation);
  const starters = players.filter((p) => p.position_slot <= 11);
  const coinsEarned = lineup.score_total * 10;

  return (
    <div className="flex flex-col items-center">
      {/* Score banner */}
      <div className="w-full max-w-[320px] bg-slate-800/60 rounded-xl p-4 mb-4 text-center border border-slate-700/50">
        <p className="text-xs text-slate-400 uppercase mb-1">Score Total</p>
        <p className="text-4xl font-black text-emerald-400">{lineup.score_total}</p>
        <p className="text-xs text-slate-500 mt-1">pts</p>
        <div className="flex items-center justify-center gap-1 mt-2 text-yellow-400 text-sm font-bold">
          <Coins size={14} />
          +{coinsEarned} Coins gagnés
        </div>
      </div>

      {/* Pitch */}
      <div className="relative w-full aspect-[2/3] bg-emerald-900 rounded-3xl overflow-hidden border-4 border-emerald-800 shadow-2xl mx-auto max-w-[320px]">
        <div className="absolute inset-4 border-2 border-white/10 rounded-xl" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-t-0 border-white/20 rounded-b-xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-b-0 border-white/20 rounded-t-xl" />

        {slotPositions.map((slotPos, i) => {
          const slot = i + 1;
          const player = starters.find((p) => p.position_slot === slot);
          if (!player) return null;

          const isCaptain = lineup.captain_id === player.card_id;
          const pts = player.points ?? 0;
          const displayPts = isCaptain ? pts * 2 : pts;

          return (
            <div
              key={slot}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${slotPos.x}%`, top: `${slotPos.y}%` }}
            >
              <div className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black shadow-lg ${
                slotPos.pos === 'GK' ? 'bg-yellow-500 text-black border-white' : 'bg-slate-900 text-white border-white/50'
              } ${player.is_subbed_in ? 'ring-2 ring-blue-400' : ''}`}>
                {isCaptain && <Crown size={10} className="text-yellow-300" />}
                {!isCaptain && player.card.player.position.charAt(0)}
                {player.is_subbed_in && (
                  <ArrowRightLeft size={8} className="absolute -top-1 -right-1 text-blue-400" />
                )}
              </div>
              <span className="text-[8px] font-bold text-white mt-0.5 bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap max-w-[60px] truncate">
                {player.card.player.name}
              </span>
              <span className={`text-[9px] font-black mt-0.5 px-1.5 py-0.5 rounded-full ${displayPts > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {displayPts} pts{isCaptain ? ' (C)' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

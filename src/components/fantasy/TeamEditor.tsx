import React from 'react';
import { Plus, X, Crown } from 'lucide-react';
import type { Formation, LineupPlayer, PlayerPosition } from '../../types/types';
import { VALID_FORMATIONS } from '../../types/types';

interface TeamEditorProps {
  formation: Formation;
  players: (LineupPlayer | null)[];
  onSlotClick: (slot: number) => void;
  onRemovePlayer: (slot: number) => void;
  captainId?: string;
  onSetCaptain: (cardId: string) => void;
  disabled?: boolean;
}

type SlotPosition = { x: number; y: number; pos: PlayerPosition };

const getSlotPositions = (formation: Formation): SlotPosition[] => {
  const f = VALID_FORMATIONS[formation];
  const slots: SlotPosition[] = [];

  // GK
  slots.push({ x: 50, y: 88, pos: 'GK' });

  // DEF
  const defPositions = distributePositions(f.DEF, 72);
  defPositions.forEach((x) => slots.push({ x, y: 72, pos: 'DEF' }));

  // MID
  const midPositions = distributePositions(f.MID, 47);
  midPositions.forEach((x) => slots.push({ x, y: 47, pos: 'MID' }));

  // FWD
  const fwdPositions = distributePositions(f.FWD, 22);
  fwdPositions.forEach((x) => slots.push({ x, y: 22, pos: 'FWD' }));

  return slots;
};

const distributePositions = (count: number, _y: number): number[] => {
  if (count === 1) return [50];
  if (count === 2) return [35, 65];
  if (count === 3) return [25, 50, 75];
  if (count === 4) return [15, 38, 62, 85];
  if (count === 5) return [10, 30, 50, 70, 90];
  return [50];
};

const POS_LABELS: Record<PlayerPosition, string> = {
  GK: 'GB',
  DEF: 'DEF',
  MID: 'MIL',
  FWD: 'ATT',
};

export const TeamEditor: React.FC<TeamEditorProps> = ({ formation, players, onSlotClick, onRemovePlayer, captainId, onSetCaptain, disabled }) => {
  const slotPositions = getSlotPositions(formation);

  return (
    <div className="flex flex-col items-center">
      {/* Pitch */}
      <div className="relative w-full aspect-[2/3] bg-emerald-900 rounded-3xl overflow-hidden border-4 border-emerald-800 shadow-2xl mx-auto max-w-[320px]">
        {/* Field markings */}
        <div className="absolute inset-4 border-2 border-white/10 rounded-xl" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-t-0 border-white/20 rounded-b-xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-b-0 border-white/20 rounded-t-xl" />

        {/* Player slots (1-11) */}
        {slotPositions.map((slotPos, i) => {
          const slot = i + 1;
          const player = players.find((p) => p?.position_slot === slot) || null;

          return (
            <div
              key={slot}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${slotPos.x}%`, top: `${slotPos.y}%` }}
            >
              {player ? (
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => !disabled && onSetCaptain(player.card_id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black shadow-lg transition-all ${
                      slotPos.pos === 'GK'
                        ? 'bg-yellow-500 text-black border-white'
                        : 'bg-slate-900 text-white border-white/50'
                    } ${captainId === player.card_id ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    {captainId === player.card_id ? <Crown size={12} /> : player.card.player.position.charAt(0)}
                  </button>
                  <span className="text-[8px] font-bold text-white mt-0.5 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-[2px] whitespace-nowrap max-w-[60px] truncate">
                    {player.card.player.name}
                  </span>
                  {!disabled && (
                    <button onClick={() => onRemovePlayer(slot)} className="mt-0.5 text-red-400 hover:text-red-300">
                      <X size={10} />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => !disabled && onSlotClick(slot)}
                  disabled={disabled}
                  className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-white/40 hover:border-emerald-400 hover:text-emerald-400 transition-colors disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
              )}
              {!player && (
                <span className="text-[7px] text-white/30 mt-0.5">{POS_LABELS[slotPos.pos]}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bench */}
      <div className="mt-4 w-full max-w-[320px]">
        <p className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Banc de touche</p>
        <div className="flex gap-2 justify-center">
          {[12, 13, 14, 15].map((slot, idx) => {
            const player = players.find((p) => p?.position_slot === slot) || null;
            return (
              <div key={slot} className="flex flex-col items-center">
                <span className="text-[8px] text-slate-600 mb-1">#{idx + 1}</span>
                {player ? (
                  <div className="w-16 bg-slate-800/60 rounded-lg p-1.5 text-center border border-slate-700/50">
                    <p className="text-[9px] font-bold text-white truncate">{player.card.player.name}</p>
                    <p className="text-[8px] text-slate-500">{player.card.player.position}</p>
                    {!disabled && (
                      <button onClick={() => onRemovePlayer(slot)} className="text-red-400 mt-0.5"><X size={10} /></button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => !disabled && onSlotClick(slot)}
                    disabled={disabled}
                    className="w-16 h-12 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600 hover:border-emerald-500 transition-colors disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

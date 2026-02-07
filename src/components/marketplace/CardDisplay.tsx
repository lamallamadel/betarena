import React from 'react';
import { Lock } from 'lucide-react';
import type { Card, CardScarcity } from '../../types/types';

const SCARCITY_COLORS: Record<CardScarcity, string> = {
  COMMON: 'bg-slate-500',
  RARE: 'bg-blue-500',
  EPIC: 'bg-purple-500',
  LEGENDARY: 'bg-yellow-500',
};

const SCARCITY_BORDER: Record<CardScarcity, string> = {
  COMMON: 'border-slate-600',
  RARE: 'border-blue-500/50',
  EPIC: 'border-purple-500/50',
  LEGENDARY: 'border-yellow-500/50',
};

interface CardDisplayProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showSerial?: boolean;
}

const SIZE_MAP = {
  sm: 'w-28 h-36',
  md: 'w-36 h-44',
  lg: 'w-44 h-56',
};

export const CardDisplay: React.FC<CardDisplayProps> = ({ card, size = 'md', onClick, showSerial = true }) => {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`${SIZE_MAP[size]} relative rounded-xl border-2 ${SCARCITY_BORDER[card.scarcity]} bg-slate-800/80 flex flex-col items-center justify-between p-3 transition-all ${onClick ? 'active:scale-95 hover:bg-slate-700/80 cursor-pointer' : 'cursor-default'}`}
    >
      {/* Scarcity badge */}
      <span className={`absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full text-white ${SCARCITY_COLORS[card.scarcity]}`}>
        {card.scarcity}
      </span>

      {/* Lock indicator */}
      {card.is_locked && (
        <span className="absolute top-1.5 left-1.5 text-red-400">
          <Lock size={12} />
        </span>
      )}

      {/* Position badge */}
      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-3">
        {card.player.position}
      </span>

      {/* Player name */}
      <div className="text-center mt-1">
        <p className="text-sm font-bold text-white leading-tight">{card.player.name}</p>
        <p className="text-[10px] text-slate-400">{card.player.club}</p>
      </div>

      {/* Serial number */}
      {showSerial && (
        <span className="text-[9px] text-slate-500 font-mono">
          #{card.serial_number}/{card.max_supply === 0 ? '∞' : card.max_supply}
        </span>
      )}
    </button>
  );
};

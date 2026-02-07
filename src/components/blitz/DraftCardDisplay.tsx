import React from 'react';
import { Check } from 'lucide-react';
import type { DraftCard, DraftCardTier } from '../../types/types';

const TIER_COLORS: Record<DraftCardTier, { bg: string; text: string; border: string }> = {
  GOLD: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
  SILVER: { bg: 'bg-slate-300/10', text: 'text-slate-300', border: 'border-slate-400/40' },
  BRONZE: { bg: 'bg-amber-700/20', text: 'text-amber-600', border: 'border-amber-700/40' },
};

interface DraftCardDisplayProps {
  draftCard: DraftCard;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const DraftCardDisplay: React.FC<DraftCardDisplayProps> = ({ draftCard, selected, onClick, disabled }) => {
  const tier = TIER_COLORS[draftCard.tier];

  return (
    <button
      onClick={onClick}
      disabled={disabled || selected}
      className={`relative w-full rounded-xl border-2 p-2.5 transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10 opacity-60'
          : `${tier.border} ${tier.bg} ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 hover:brightness-110 cursor-pointer'}`
      }`}
    >
      {selected && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check size={12} className="text-black" />
        </div>
      )}
      <span className={`text-[8px] font-black uppercase ${tier.text}`}>{draftCard.tier}</span>
      <p className="text-xs font-bold text-white mt-0.5 truncate">{draftCard.player.name}</p>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px] text-slate-500">{draftCard.player.club}</span>
        <span className="text-[9px] font-bold text-emerald-400">{draftCard.player.position}</span>
      </div>
    </button>
  );
};

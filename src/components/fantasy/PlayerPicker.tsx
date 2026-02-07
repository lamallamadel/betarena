import React from 'react';
import { X, UserPlus } from 'lucide-react';
import type { Card, PlayerPosition, CardScarcity } from '../../types/types';

const SCARCITY_COLORS: Record<CardScarcity, string> = {
  COMMON: 'text-slate-400',
  RARE: 'text-blue-400',
  EPIC: 'text-purple-400',
  LEGENDARY: 'text-yellow-400',
};

const POS_LABELS: Record<PlayerPosition, string> = {
  GK: 'Gardien',
  DEF: 'Défenseur',
  MID: 'Milieu',
  FWD: 'Attaquant',
};

interface PlayerPickerProps {
  slot: number;
  position: PlayerPosition;
  availableCards: Card[];
  onSelect: (cardId: string) => void;
  onClose: () => void;
  alreadySelected: string[];
}

export const PlayerPicker: React.FC<PlayerPickerProps> = ({ position, availableCards, onSelect, onClose, alreadySelected }) => {
  const filtered = availableCards.filter(
    (c) => c.player.position === position && !c.is_locked && !alreadySelected.includes(c.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-t-2xl border-t border-slate-700 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Choisir un {POS_LABELS[position]}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <UserPlus size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Aucun joueur disponible à ce poste</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filtered.map((card) => (
                <button
                  key={card.id}
                  onClick={() => { onSelect(card.id); onClose(); }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                      {position}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{card.player.name}</p>
                      <p className="text-[11px] text-slate-500">{card.player.club}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${SCARCITY_COLORS[card.scarcity]}`}>
                    {card.scarcity}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

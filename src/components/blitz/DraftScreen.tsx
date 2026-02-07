import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { DraftCardDisplay } from './DraftCardDisplay';
import type { BlitzEntry, DraftCard, PlayerPosition } from '../../types/types';

interface DraftScreenProps {
  entry: BlitzEntry;
  onSubmit: (selectedIds: string[]) => Promise<void>;
  onClose: () => void;
}

const POS_LABELS: Record<PlayerPosition, string> = {
  GK: 'GB', DEF: 'DEF', MID: 'MIL', FWD: 'ATT',
};

// RG-N04: Fixed formation 1-1-2-1
const REQUIRED = { GK: 1, DEF: 1, MID: 2, FWD: 1 };

export const DraftScreen: React.FC<DraftScreenProps> = ({ entry, onSubmit, onClose }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    entry.selected_lineup?.map((c) => c.player_reference_id) || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pool = entry.draft_pool || [];
  const selectedCards = selectedIds.map((id) => pool.find((c) => c.player_reference_id === id)!).filter(Boolean);

  // Count positions of selected
  const posCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  selectedCards.forEach((c) => { posCounts[c.player.position]++; });

  const canSelectPosition = (pos: PlayerPosition): boolean => {
    return posCounts[pos] < REQUIRED[pos];
  };

  const toggleCard = (card: DraftCard) => {
    const id = card.player_reference_id;
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      setError('');
    } else {
      if (selectedIds.length >= 5) { setError('Maximum 5 joueurs'); return; }
      if (!canSelectPosition(card.player.position)) {
        setError(`Limite atteinte pour ${POS_LABELS[card.player.position]}`);
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
      setError('');
    }
  };

  const isValid = selectedIds.length === 5 &&
    posCounts.GK === 1 && posCounts.DEF === 1 && posCounts.MID === 2 && posCounts.FWD === 1;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(selectedIds);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const goldCards = pool.filter((c) => c.tier === 'GOLD');
  const silverCards = pool.filter((c) => c.tier === 'SILVER');
  const bronzeCards = pool.filter((c) => c.tier === 'BRONZE');

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-base font-bold text-white">Draft Blitz 5</h2>
          <p className="text-[10px] text-slate-400">Formation : 1 GB - 1 DEF - 2 MIL - 1 ATT</p>
        </div>
      </div>

      {/* Formation slots */}
      <div className="shrink-0 flex justify-center gap-2 px-4 py-3 border-b border-slate-800/50">
        {(['GK', 'DEF', 'MID', 'MID', 'FWD'] as PlayerPosition[]).map((pos, i) => {
          const matchingSelected = selectedCards.filter((c) => c.player.position === pos);
          const filled = i < matchingSelected.length + (pos === 'MID' && i === 3 ? (posCounts.MID >= 2 ? 0 : -1) : 0);
          // Simplified: count slots filled per position
          const slotFilled = (() => {
            if (pos === 'GK') return posCounts.GK > 0;
            if (pos === 'DEF') return posCounts.DEF > 0;
            if (pos === 'FWD') return posCounts.FWD > 0;
            if (pos === 'MID') return i === 2 ? posCounts.MID >= 1 : posCounts.MID >= 2;
            return false;
          })();

          return (
            <div key={i} className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center text-xs ${
              slotFilled ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 border-dashed bg-slate-800/30'
            }`}>
              {slotFilled ? <Check size={14} className="text-emerald-400" /> : <span className="text-slate-500 font-bold">{POS_LABELS[pos]}</span>}
              <span className="text-[8px] text-slate-500 mt-0.5">{POS_LABELS[pos]}</span>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-center text-xs text-red-400 py-2">{error}</p>
      )}

      {/* Card pool */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Gold */}
        <p className="text-xs font-bold text-yellow-400 mb-2 uppercase">Gold</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {goldCards.map((c) => (
            <DraftCardDisplay
              key={c.player_reference_id}
              draftCard={c}
              selected={selectedIds.includes(c.player_reference_id)}
              onClick={() => toggleCard(c)}
              disabled={!selectedIds.includes(c.player_reference_id) && !canSelectPosition(c.player.position)}
            />
          ))}
        </div>

        {/* Silver */}
        <p className="text-xs font-bold text-slate-300 mb-2 uppercase">Silver</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {silverCards.map((c) => (
            <DraftCardDisplay
              key={c.player_reference_id}
              draftCard={c}
              selected={selectedIds.includes(c.player_reference_id)}
              onClick={() => toggleCard(c)}
              disabled={!selectedIds.includes(c.player_reference_id) && !canSelectPosition(c.player.position)}
            />
          ))}
        </div>

        {/* Bronze */}
        <p className="text-xs font-bold text-amber-600 mb-2 uppercase">Bronze</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {bronzeCards.map((c) => (
            <DraftCardDisplay
              key={c.player_reference_id}
              draftCard={c}
              selected={selectedIds.includes(c.player_reference_id)}
              onClick={() => toggleCard(c)}
              disabled={!selectedIds.includes(c.player_reference_id) && !canSelectPosition(c.player.position)}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-900/80">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500 text-black active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {submitting ? 'Validation...' : `Valider l'équipe (${selectedIds.length}/5)`}
        </button>
      </div>
    </div>
  );
};

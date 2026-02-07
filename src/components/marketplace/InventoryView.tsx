import React, { useState } from 'react';
import { ArrowLeft, Coins, Briefcase } from 'lucide-react';
import { useMarketplace } from '../../hooks/useMarketplace';
import { CardDisplay } from './CardDisplay';
import { SellModal } from './SellModal';
import type { RichUserProfile, Card, PlayerPosition, CardScarcity } from '../../types/types';

interface InventoryViewProps {
  user: RichUserProfile;
  onNavigate: (view: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ user, onNavigate }) => {
  const { myCards, listCard } = useMarketplace(user.uid);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [posFilter, setPosFilter] = useState<PlayerPosition | 'ALL'>('ALL');
  const [scarcityFilter, setScarcityFilter] = useState<CardScarcity | 'ALL'>('ALL');

  let filtered = myCards;
  if (posFilter !== 'ALL') filtered = filtered.filter((c) => c.player.position === posFilter);
  if (scarcityFilter !== 'ALL') filtered = filtered.filter((c) => c.scarcity === scarcityFilter);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate('HOME')} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-white">Mon Inventaire</h1>
        <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
          <Coins size={16} />
          {user.coins}
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        <select value={posFilter} onChange={(e) => setPosFilter(e.target.value as any)} className="bg-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 border border-slate-700">
          <option value="ALL">Tous postes</option>
          <option value="GK">Gardien</option>
          <option value="DEF">Défenseur</option>
          <option value="MID">Milieu</option>
          <option value="FWD">Attaquant</option>
        </select>
        <select value={scarcityFilter} onChange={(e) => setScarcityFilter(e.target.value as any)} className="bg-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 border border-slate-700">
          <option value="ALL">Toutes raretés</option>
          <option value="COMMON">Common</option>
          <option value="RARE">Rare</option>
          <option value="EPIC">Epic</option>
          <option value="LEGENDARY">Legendary</option>
        </select>
      </div>

      {/* Cards grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Briefcase size={40} className="mb-3 opacity-50" />
            <p className="text-sm">Aucune carte dans votre inventaire</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 justify-items-center">
            {filtered.map((card) => (
              <CardDisplay
                key={card.id}
                card={card}
                size="md"
                onClick={() => !card.is_locked && setSelectedCard(card)}
                showSerial
              />
            ))}
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {selectedCard && (
        <SellModal
          card={selectedCard}
          onSell={listCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

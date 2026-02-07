import React, { useState } from 'react';
import { Coins, Search } from 'lucide-react';
import { CardDisplay } from './CardDisplay';
import type { MarketListing, PlayerPosition, CardScarcity } from '../../types/types';

interface TransfersTabProps {
  listings: MarketListing[];
  onBuyListing: (id: string) => Promise<void>;
  userId: string;
}

export const TransfersTab: React.FC<TransfersTabProps> = ({ listings, onBuyListing, userId }) => {
  const [posFilter, setPosFilter] = useState<PlayerPosition | 'ALL'>('ALL');
  const [scarcityFilter, setScarcityFilter] = useState<CardScarcity | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'price_asc' | 'recent'>('recent');
  const [buying, setBuying] = useState<string | null>(null);

  let filtered = listings.filter((l) => l.status === 'ACTIVE');
  if (posFilter !== 'ALL') filtered = filtered.filter((l) => l.card.player.position === posFilter);
  if (scarcityFilter !== 'ALL') filtered = filtered.filter((l) => l.card.scarcity === scarcityFilter);

  if (sortBy === 'price_asc') filtered.sort((a, b) => a.price - b.price);
  else filtered.sort((a, b) => b.created_at - a.created_at);

  const handleBuy = async (id: string) => {
    setBuying(id);
    try { await onBuyListing(id); } finally { setBuying(null); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
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
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 border border-slate-700">
          <option value="recent">Récents</option>
          <option value="price_asc">Prix ↑</option>
        </select>
      </div>

      {/* Listings */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Search size={40} className="mb-3 opacity-50" />
          <p className="text-sm">Aucune offre trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto">
          {filtered.map((listing) => (
            <div key={listing.id} className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-2 flex flex-col items-center">
              <CardDisplay card={listing.card} size="sm" showSerial />
              <div className="flex items-center gap-1 mt-2 text-yellow-400 font-bold text-sm">
                <Coins size={14} />
                {listing.price}
              </div>
              <p className="text-[9px] text-slate-500">par {listing.seller_pseudo}</p>
              {listing.seller_id !== userId ? (
                <button
                  onClick={() => handleBuy(listing.id)}
                  disabled={buying === listing.id}
                  className="w-full mt-2 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-black active:scale-95 transition-all disabled:opacity-40"
                >
                  {buying === listing.id ? 'Achat...' : 'Acheter'}
                </button>
              ) : (
                <span className="text-[10px] text-slate-500 mt-2">Votre offre</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

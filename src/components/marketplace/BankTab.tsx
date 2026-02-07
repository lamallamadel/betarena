import React, { useState } from 'react';
import { Package, Coins } from 'lucide-react';
import type { Pack } from '../../types/types';

interface BankTabProps {
  packs: Pack[];
  onBuyPack: (packId: string) => Promise<void>;
}

export const BankTab: React.FC<BankTabProps> = ({ packs, onBuyPack }) => {
  const [buying, setBuying] = useState<string | null>(null);

  const handleBuy = async (packId: string) => {
    setBuying(packId);
    try {
      await onBuyPack(packId);
    } finally {
      setBuying(null);
    }
  };

  if (packs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Package size={40} className="mb-3 opacity-50" />
        <p className="text-sm">Aucun pack disponible</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {packs.map((pack) => (
        <div key={pack.id} className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3 flex flex-col items-center">
          <Package size={32} className="text-yellow-500 mb-2" />
          <p className="text-sm font-bold text-white text-center">{pack.name}</p>
          <div className="flex flex-wrap gap-1 mt-1 mb-2 justify-center">
            {pack.contents.map((c, i) => (
              <span key={i} className="text-[9px] text-slate-400">
                {c.count}x {c.scarcity}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mb-2">
            Stock : {pack.stock > 0 ? pack.stock : 'Épuisé'}
          </p>
          <button
            onClick={() => handleBuy(pack.id)}
            disabled={pack.stock <= 0 || buying === pack.id}
            className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500 text-black active:scale-95"
          >
            <Coins size={14} />
            {buying === pack.id ? 'Achat...' : `${pack.price}`}
          </button>
        </div>
      ))}
    </div>
  );
};

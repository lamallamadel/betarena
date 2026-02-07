import React, { useState } from 'react';
import { X, Coins } from 'lucide-react';
import type { Card } from '../../types/types';

const MARKET_TAX_RATE = 0.10;

interface SellModalProps {
  card: Card;
  onSell: (cardId: string, price: number) => Promise<void>;
  onClose: () => void;
}

export const SellModal: React.FC<SellModalProps> = ({ card, onSell, onClose }) => {
  const [price, setPrice] = useState<number>(card.player.base_value);
  const [selling, setSelling] = useState(false);

  const tax = Math.floor(price * MARKET_TAX_RATE);
  const netSeller = price - tax;

  const handleSell = async () => {
    if (price <= 0) return;
    setSelling(true);
    try {
      await onSell(card.id, price);
      onClose();
    } finally {
      setSelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Vendre</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Card info */}
        <div className="bg-slate-800/60 rounded-xl p-3 mb-4 text-center">
          <p className="font-bold text-white">{card.player.name}</p>
          <p className="text-xs text-slate-400">{card.player.club} · {card.player.position}</p>
          <span className="text-[10px] text-slate-500 font-mono">#{card.serial_number}/{card.max_supply || '∞'}</span>
        </div>

        {/* Price input */}
        <label className="text-xs text-slate-400 mb-1 block">Prix de vente (Coins)</label>
        <input
          type="number"
          min={1}
          value={price}
          onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm mb-4 focus:outline-none focus:border-emerald-500"
        />

        {/* Calculator */}
        <div className="bg-slate-800/40 rounded-lg p-3 mb-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Prix affiché</span>
            <span className="text-white font-medium">{price} <Coins size={12} className="inline" /></span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Taxe Marché ({MARKET_TAX_RATE * 100}%)</span>
            <span className="text-red-400">-{tax}</span>
          </div>
          <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold">
            <span className="text-slate-300">Net Vendeur</span>
            <span className="text-emerald-400">{netSeller} <Coins size={12} className="inline" /></span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSell}
          disabled={price <= 0 || selling}
          className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500 text-black active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {selling ? 'Mise en vente...' : 'Mettre en vente'}
        </button>
      </div>
    </div>
  );
};

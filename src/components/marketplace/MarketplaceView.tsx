import React, { useState } from 'react';
import { ArrowLeft, Coins, Store, ArrowLeftRight } from 'lucide-react';
import { useMarketplace } from '../../hooks/useMarketplace';
import { BankTab } from './BankTab';
import { TransfersTab } from './TransfersTab';
import type { RichUserProfile } from '../../types/types';

interface MarketplaceViewProps {
  user: RichUserProfile;
  onNavigate: (view: string) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'transfers'>('bank');
  const { packs, listings, buyPack, buyListing } = useMarketplace(user.uid);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate('HOME')} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-white">Marché</h1>
        <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
          <Coins size={16} />
          {user.coins}
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'bank' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}
        >
          <Store size={16} />
          La Banque
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'transfers' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}
        >
          <ArrowLeftRight size={16} />
          Transferts
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'bank' && (
          <BankTab packs={packs} onBuyPack={buyPack} />
        )}
        {activeTab === 'transfers' && (
          <TransfersTab listings={listings} onBuyListing={buyListing} userId={user.uid} />
        )}
      </div>
    </div>
  );
};

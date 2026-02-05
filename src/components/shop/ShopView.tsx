import React from 'react';
import { ChevronLeft, Coins, Lock } from 'lucide-react';
import { MOCK_SHOP } from '../../data/mockData';
import type { RichUserProfile } from '../../types/types';

interface ShopViewProps {
    user: RichUserProfile;
    onNavigate: (view: 'LIVE' | 'PREDICT' | 'SOCIAL' | 'SHOP' | 'RANK' | 'PROFILE' | 'HOME') => void;
    onBuyItem: (item: any) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({ user, onNavigate, onBuyItem }) => {
    return (
        <>
            <header className="pt-12 pb-2 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-900">
                <div className="px-5 flex justify-between items-center mb-4">
                    <button onClick={() => onNavigate('HOME')} className="p-2.5 bg-slate-900 rounded-full border border-slate-800"><ChevronLeft size={20} /></button>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Boutique</h2>
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                        <Coins size={14} className="text-yellow-500" />
                        <span className="text-sm font-black text-white">{user.coins.toLocaleString()}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 no-scrollbar">
                {['AVATAR', 'FRAME'].map(type => (
                    <div key={type} className="mb-8">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">{type}S EXCLUSIFS</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {MOCK_SHOP.filter(i => i.type === type).map(item => {

                                // In Maquette: const owned = user.inventory.includes(item.id);
                                // So we should stick to ID check if possible. Assuming user.inventory is string[] of IDs or similar.
                                // Let's check Maquette definition of user.inventory. It was [1, 3] (numbers).
                                // So let's assume inventory is number[] or string[].
                                const isOwned = user.inventory?.some((invItem: any) => invItem === item.id) || false;

                                const locked = user.level < item.minLevel;
                                const equipped = type === 'AVATAR' ? user.avatar === item.asset : user.frame === item.asset;

                                return (
                                    <div key={item.id} className={`bg-slate-900 border ${isOwned ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-slate-800'} rounded-[40px] p-6 flex flex-col items-center relative overflow-hidden transition-all active:scale-[0.97]`}>
                                        {locked && (
                                            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                                                <Lock size={20} className="text-slate-600 mb-2" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">LVL {item.minLevel} REQUIS</span>
                                            </div>
                                        )}
                                        <div className={`w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center text-4xl border-4 ${item.type === 'FRAME' ? item.asset : 'border-slate-800'} mb-4 shadow-inner`}>
                                            {item.type === 'AVATAR' ? item.asset : '👤'}
                                        </div>
                                        <span className="text-[10px] font-black text-white uppercase mb-4 text-center">{item.name}</span>
                                        <button onClick={() => onBuyItem(item)} className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${isOwned ? (equipped ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-emerald-500') : 'bg-white text-black'}`}>
                                            {isOwned ? (equipped ? 'Équipé' : 'Équiper') : `${item.price} 🪙`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

import React from 'react';
import {Coins, Shield, Flag, Sparkles, Gift, Zap} from 'lucide-react';
import type {UserProfile} from "../../types/types.ts";

interface ShopProps {
    onBuy: (cost: number, itemId: string) => Promise<void>,
    onClaimBonus: () => Promise<void>,
    isBonusAvailable: boolean,
    profile?: UserProfile | null
}

// Tes items exacts
const SHOP_ITEMS = [
    {
        id: 'badge_expert',
        name: 'Expert Ligue 1',
        type: 'BADGE',
        cost: 500,
        icon: <Shield size={18} className="text-yellow-400 fill-yellow-400/20"/>
    },
    {
        id: 'frame_neon',
        name: 'Cadre Néon',
        type: 'FRAME',
        cost: 1200,
        icon: <div className="w-4 h-4 rounded-full border-2 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]"/>
    },
    {
        id: 'title_oracle',
        name: 'Titre "Oracle"',
        type: 'TITLE',
        cost: 2500,
        icon: <Sparkles size={18} className="text-purple-400"/>
    },
    {
        id: 'badge_ultra',
        name: 'Ultra Fan',
        type: 'BADGE',
        cost: 300,
        icon: <Flag size={18} className="text-red-500 fill-red-500/20"/>
    },
];

export const Shop: React.FC<ShopProps> = ({profile, onBuy, onClaimBonus, isBonusAvailable}) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 animate-in fade-in zoom-in-95 scrollbar-hide min-h-0">

            {/* Bannière Bonus - Code UI original */}
            <div
                className="bg-gradient-to-r from-violet-900 to-indigo-900 rounded-2xl p-5 border border-indigo-500/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Gift
                    size={80}/></div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Gift size={18}
                                                                                                    className="text-yellow-400"/> Bonus
                        Quotidien</h3>
                    <p className="text-xs text-indigo-200 mb-4 max-w-[70%]">Revenez chaque jour pour gagner des coins et
                        de l'XP gratuitement !</p>
                    <button
                        onClick={onClaimBonus}
                        disabled={!isBonusAvailable}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg ${isBonusAvailable ? 'bg-yellow-400 text-yellow-950 hover:bg-yellow-300 shadow-yellow-400/20' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                    >
                        <Zap size={14} className="fill-current"/> {isBonusAvailable ? "Réclamer" : "Déjà réclamé"}
                    </button>
                </div>
            </div>

            {/* Grille Items - Code UI original */}
            <div className="grid grid-cols-2 gap-3">
                {SHOP_ITEMS.map(item => {
                    // @ts-ignore
                    const isOwned = profile?.inventory?.includes(item.id);
                    const canAfford = (profile?.coins || 0) >= item.cost;

                    return (
                        <div key={item.id}
                             className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center">
                            <div className="mb-3 p-3 bg-slate-950 rounded-full shadow-inner">{item.icon}</div>
                            <h4 className="font-bold text-xs text-white mb-1">{item.name}</h4>

                            <button
                                onClick={() => onBuy(item.cost, item.id)}
                                disabled={isOwned || !canAfford}
                                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 mt-2 ${isOwned ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 px-3 py-1 rounded text-yellow-400 border border-slate-700'}`}
                            >
                                {isOwned ? 'Possédé' : <><Coins size={12} className="text-yellow-400"/> {item.cost}</>}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
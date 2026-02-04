import React from 'react';
import { Trophy, ShoppingBag, Coins, Zap } from 'lucide-react';

interface User {
    id?: string;
    displayName: string | null;
    photoURL?: string | null;
    xp?: number;
    level?: number;
    coins?: number;
    avatar?: string;
    rank?: string;
}

interface HeaderProps {
    user: User | null;
    onOpenShop: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenShop }) => {
    return (
        <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <Trophy className="text-white" size={20} />
                    </div>
                    <span className="font-bold text-xl text-white tracking-tight">BetArena</span>
                </div>

                {user ? (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onOpenShop}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all relative"
                        >
                            <ShoppingBag size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        </button>

                        <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-md p-2 pr-4 rounded-full border border-slate-700 shadow-lg">
                            <div className="relative">
                                <img
                                    src={user.photoURL || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName || 'User'}`}
                                    alt="avatar"
                                    className="w-10 h-10 rounded-full bg-slate-700 p-0.5 object-cover"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                                    {user.level || 1}
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-xs text-slate-400 font-medium leading-tight">
                                    {user.displayName || 'Joueur'}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-sm">
                                        <Coins size={14} className="fill-yellow-400/20" />
                                        {user.coins ? user.coins.toLocaleString() : 0}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-sm">
                                        <Zap size={14} className="fill-indigo-400/20" />
                                        {user.xp ? user.xp.toLocaleString() : 0} XP
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-400 font-medium">Mode Invité</div>
                )}
            </div>
        </nav>
    );
};
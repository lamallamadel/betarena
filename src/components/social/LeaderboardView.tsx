import React from 'react';
import { ChevronLeft, Trophy, Coins } from 'lucide-react';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { MOCK_LEADERBOARD } from '../../data/mockData';
import type { RichUserProfile } from '../../types/types';

interface LeaderboardViewProps {
    user: RichUserProfile;
    onNavigate: (view: 'LIVE' | 'PREDICT' | 'SOCIAL' | 'SHOP' | 'RANK' | 'PROFILE' | 'HOME') => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ user, onNavigate }) => {

    // Mock ranking logic
    const top3 = MOCK_LEADERBOARD.slice(0, 3);
    const rest = MOCK_LEADERBOARD.slice(3);
    const myRank = MOCK_LEADERBOARD.find(u => u.user === user.username) || { rank: 999, coins: user.coins || 0 };

    return (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up relative">
            {/* HEADER */}
            <div className="p-5 flex justify-between items-center">
                <button onClick={() => onNavigate('HOME')} className="p-2.5 bg-slate-900 rounded-full border border-slate-800"><ChevronLeft size={20} /></button>
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Classement</h2>
                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 border border-yellow-500/20"><Trophy size={20} /></div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-5">

                {/* PODIUM */}
                <div className="flex items-end justify-center gap-4 mb-8 mt-4">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                        <div className="text-slate-400 font-black mb-1">2</div>
                        <AvatarDisplay avatar={top3[1].avatar as any} size="md" frame="border-slate-400" level={top3[1].level} />
                        <div className="mt-2 h-20 w-20 bg-slate-800 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-slate-400">
                            <span className="text-xs font-bold text-white max-w-[80px] truncate">{top3[1].user}</span>
                            <span className="text-[10px] text-yellow-500 font-mono">{top3[1].coins}</span>
                        </div>
                    </div>
                    {/* 1st Place */}
                    <div className="flex flex-col items-center relative -top-4">
                        <div className="text-yellow-400 text-2xl mb-2 animate-bounce">👑</div>
                        <AvatarDisplay avatar={top3[0].avatar as any} size="lg" frame="border-yellow-400 ring-4 ring-yellow-500/20" level={top3[0].level} />
                        <div className="mt-2 h-28 w-24 bg-indigo-900/50 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-yellow-400 relative overflow-hidden">
                            <div className="absolute inset-0 bg-yellow-500/10"></div>
                            <span className="text-sm font-black text-white max-w-[90px] truncate">{top3[0].user}</span>
                            <span className="text-xs text-yellow-500 font-black font-mono">{top3[0].coins}</span>
                        </div>
                    </div>
                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <div className="text-amber-700 font-black mb-1">3</div>
                        <AvatarDisplay avatar={top3[2].avatar as any} size="md" frame="border-amber-700" level={top3[2].level} />
                        <div className="mt-2 h-16 w-20 bg-slate-800 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-amber-700">
                            <span className="text-xs font-bold text-white max-w-[80px] truncate">{top3[2].user}</span>
                            <span className="text-[10px] text-yellow-500 font-mono">{top3[2].coins}</span>
                        </div>
                    </div>
                </div>

                {/* LIST */}
                <div className="bg-slate-900 rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl mb-8">
                    {rest.map((item) => (
                        <div key={item.user} className={`flex items-center gap-4 p-4 border-b border-slate-800/50 last:border-0 ${item.user === user.username ? 'bg-emerald-500/10' : ''}`}>
                            <span className="w-6 text-sm font-bold text-slate-500">#{item.rank}</span>
                            <AvatarDisplay avatar={item.avatar as any} size="sm" frame="border-slate-800" level={item.level} />
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-white uppercase">{item.user}</h4>
                            </div>
                            <div className="text-right text-xs font-black text-white flex items-center gap-1">
                                <Coins size={10} className="text-yellow-500" />
                                <span>{item.coins.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* STICKY USER ROW (if not in podium) */}
            <div className="absolute bottom-20 left-5 right-5 bg-emerald-900/90 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-4 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-slide-up">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center border-2 border-white">
                    #{myRank.rank}
                </div>
                <div className="flex-1">
                    <div className="text-xs font-bold text-emerald-100 uppercase">Votre Position</div>
                    <div className="text-[10px] text-emerald-400">Continuez à parier ! 🔥</div>
                </div>
                <div className="text-right">
                    <span className="text-sm font-black text-white">{user.coins?.toLocaleString() || 0}</span>
                    <Coins size={12} className="inline ml-1 text-yellow-400" />
                </div>
            </div>
        </div>
    );
};

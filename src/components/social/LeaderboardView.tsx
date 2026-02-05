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
    return (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up p-5 pt-12 overflow-y-auto no-scrollbar pb-24">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => onNavigate('HOME')} className="p-2.5 bg-slate-900 rounded-full border border-slate-800"><ChevronLeft size={20} /></button>
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Classement</h2>
                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 border border-yellow-500/20"><Trophy size={20} /></div>
            </div>
            <div className="bg-slate-900 rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl">
                {MOCK_LEADERBOARD.map((item, i) => (
                    <div key={item.user} className={`flex items-center gap-4 p-5 border-b border-slate-800/50 last:border-0 ${item.user === user.username ? 'bg-emerald-500/5' : ''}`}>
                        <span className={`w-6 text-sm font-black ${i === 0 ? 'text-yellow-500' : 'text-slate-600'}`}>{item.rank}</span>
                        <AvatarDisplay avatar={item.avatar as any} frame="border-slate-800" level={item.level} />
                        <div className="flex-1">
                            <h4 className="text-xs font-black text-white uppercase">{item.user}</h4>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Niveau {item.level}</span>
                        </div>
                        <div className="text-right text-xs font-black text-white">
                            <div className="flex items-center gap-1 justify-end">
                                <Coins size={10} className="text-yellow-500" />
                                <span>{item.coins.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

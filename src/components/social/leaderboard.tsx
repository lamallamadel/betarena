import React from 'react';
import {Share2} from 'lucide-react';
import type {UserProfile} from "../../types/types.ts";

interface LeaderboardProps {
    profile?: UserProfile | null
}

export const Leaderboard: React.FC<LeaderboardProps> = ({profile}) => {
    // Données simulées (Bots + Toi)
    const fakeUsers = [
        {pseudo: 'ZidaneDu13', coins: 2500, rank: 1},
        {pseudo: 'Anna_Bet', coins: 2100, rank: 2},
        {pseudo: 'ParisManiac', coins: 1800, rank: 3},
    ];

    // On insère le vrai profil utilisateur dans la liste pour l'affichage
    const currentUserEntry = profile ? {
        pseudo: profile.pseudo,
        coins: profile.coins,
        rank: 4, // Pour la démo, on te met 4ème
        isMe: true
    } : null;

    const list = [...fakeUsers, ...(currentUserEntry ? [currentUserEntry] : [])].sort((a, b) => b.coins - a.coins);

    return (
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                {list.map((entry, index) => (
                    <div
                        key={entry.pseudo}
                        className={`flex items-center justify-between p-4 border-b border-slate-700/50 last:border-0 ${
                            // @ts-ignore
                            entry.isMe ? 'bg-indigo-900/20' : ''
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500 text-yellow-950' :
                                    index === 1 ? 'bg-slate-300 text-slate-800' :
                                        index === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-700 text-slate-400'
                            }`}>
                                {index + 1}
                            </div>
                            <div className="flex flex-col">
                <span className={`text-sm font-bold ${
                    // @ts-ignore
                    entry.isMe ? 'text-indigo-300' : 'text-slate-300'
                }`}>
                  {entry.pseudo}
                </span>
                                {/* @ts-ignore */}
                                {entry.isMe &&
                                    <span className="text-[10px] text-indigo-400 uppercase">C'est vous</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="font-mono font-bold text-yellow-500 text-sm">
                                {entry.coins} <span className="text-[10px] text-slate-500">pts</span>
                            </div>

                            {/* @ts-ignore */}
                            {entry.isMe && (
                                <button className="text-slate-500 hover:text-white transition-colors">
                                    <Share2 size={16}/>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
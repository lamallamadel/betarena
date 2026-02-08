import React from 'react';

interface Player {
    name: string;
    num: number;
    x: number;
    y: number;
    pos?: string;
}

interface SoccerPitchProps {
    starters: Player[];
    isHome: boolean;
}

export const SoccerPitch: React.FC<SoccerPitchProps> = ({ starters, isHome }) => (
    <div className={`relative w-full aspect-[2/3] bg-emerald-900 rounded-3xl overflow-hidden border-4 border-emerald-800 shadow-2xl mb-6 mx-auto max-w-[320px] ${!isHome ? 'rotate-180' : ''}`}>
        <div className="absolute inset-4 border-2 border-white/10 rounded-xl" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-t-0 border-white/20 rounded-b-xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-b-0 border-white/20 rounded-t-xl" />

        {starters.map((p, i) => (
            p.x && (
                <div key={i} className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center ${!isHome ? 'rotate-180' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black shadow-lg ${p.num === 1 || p.num === 99 || p.num === 31 || p.num === 22 ? 'bg-yellow-500 text-black border-white' : 'bg-slate-900 text-white border-white/50'}`}>
                        {p.num}
                    </div>
                    <span className="text-[8px] font-bold text-white mt-1 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-[2px] shadow-sm whitespace-nowrap">
                        {p.name}
                    </span>
                </div>
            )
        ))}
    </div>
);

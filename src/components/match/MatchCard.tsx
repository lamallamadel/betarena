import React from 'react';
import { TeamLogo } from '../ui/TeamLogo';

interface MatchCardProps {
    match: any;
    onClick: () => void;
    noSpoiler?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick, noSpoiler = false }) => {
    const displayScore = (h: number, a: number) => {
        if (noSpoiler) return '? : ?';
        return `${h} : ${a}`;
    };

    const isLive = match.status === 'LIVE' || match.status === 'LIVE_1ST_HALF' || match.status === 'LIVE_2ND_HALF' || match.status === 'HALF_TIME';
    const isFinished = match.status === 'FINISHED';

    return (
        <div onClick={onClick} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-2 active:scale-[0.98] transition-all cursor-pointer hover:border-emerald-500/30">
            <div className="flex justify-between items-center">
                <div className="flex flex-col items-center w-12">
                    <div className="mb-1">
                        <TeamLogo src={match.homeLogo} alt={match.home} size="md" />
                    </div>
                    <span className="text-[9px] font-black text-white uppercase text-center leading-none">{match.home}</span>
                </div>

                <div className="flex-1 flex flex-col items-center px-4">
                    {isLive ? (
                        <>
                            <span className="text-2xl font-black text-white tracking-tighter">
                                {displayScore(match.score.h, match.score.a)}
                            </span>
                            <span className="text-[9px] font-bold text-red-500 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> {noSpoiler ? '--' : match.minute}'
                            </span>
                        </>
                    ) : isFinished ? (
                        <>
                            <span className={`text-2xl font-black tracking-tighter ${noSpoiler ? 'text-slate-500' : 'text-slate-400'}`}>
                                {displayScore(match.score.h, match.score.a)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase">Terminé</span>
                        </>
                    ) : (
                        <>
                            <span className="text-xs font-black text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">{match.time}</span>
                        </>
                    )}
                </div>

                <div className="flex flex-col items-center w-12">
                    <div className="mb-1">
                        <TeamLogo src={match.awayLogo} alt={match.away} size="md" />
                    </div>
                    <span className="text-[9px] font-black text-white uppercase text-center leading-none">{match.away}</span>
                </div>
            </div>
        </div>
    );
};

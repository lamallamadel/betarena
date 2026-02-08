import React from 'react';
import type {Match} from "../../../types/types";

interface MatchHeaderProps {
  match: Match;
  goalAnimation: string | null; // 'HOME' | 'AWAY' | null
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ match, goalAnimation }) => {
  return (
    <div className={`shrink-0 mx-2 mt-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative transition-all duration-300 ${goalAnimation ? 'border-yellow-500/50 scale-[1.02]' : ''}`}>
      
      {/* Minute Badge */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-950/80 px-3 py-0.5 rounded-b-lg border-x border-b border-slate-800 backdrop-blur-sm z-10">
        <div className="flex items-center gap-1.5">
          {match.status.includes('LIVE') && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
          )}
          <span className="text-[10px] font-mono font-bold text-slate-300">
            {match.status === 'PRE_MATCH' ? 'AVANT-MATCH' : match.status === 'FINISHED' ? 'TERMINE' : `${match.minute}'`}
          </span>
        </div>
      </div>

      {/* Score Board */}
      <div className="flex items-center justify-between p-3 pt-6 pb-4">
        {/* Home Team */}
        <div className={`flex-1 flex flex-col items-center transition-transform ${goalAnimation === 'HOME' ? 'scale-110' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-black text-slate-900 border-2 border-indigo-500 text-lg mb-1 shadow-lg">
            {match.home[0]}
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{match.home}</span>
        </div>

        {/* Score */}
        <div className="px-4">
          <div className={`text-4xl font-black font-mono tracking-tighter transition-colors duration-300 ${goalAnimation ? 'text-yellow-400' : 'text-white'}`}>
            {match.status === 'PRE_MATCH' ? 'VS' : `${match.score.h}-${match.score.a}`}
          </div>
        </div>

        {/* Away Team */}
        <div className={`flex-1 flex flex-col items-center transition-transform ${goalAnimation === 'AWAY' ? 'scale-110' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-black text-slate-900 border-2 border-sky-500 text-lg mb-1 shadow-lg">
            {match.away[0]}
          </div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{match.away}</span>
        </div>
      </div>
    </div>
  );
};
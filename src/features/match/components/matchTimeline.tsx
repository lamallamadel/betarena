import React from 'react';
import { RectangleVertical, Video, Megaphone } from 'lucide-react';

interface MatchTimelineProps {
  events: any[];
  filterHighlights: boolean;
  onToggleFilter: () => void;
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({ events, filterHighlights, onToggleFilter }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
      <div className="shrink-0 px-4 py-2 flex justify-end">
        <button onClick={onToggleFilter} className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${filterHighlights ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-slate-800 text-slate-500'}`}>
           {filterHighlights ? 'Temps forts' : 'Tout voir'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 pb-4 relative no-scrollbar">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2 z-0"></div>
        <div className="space-y-3">
          {events.filter(e => !filterHighlights || ['GOAL', 'CARD_RED'].includes(e.type)).map((e) => {
             const isHome = e.team === 'HOME';
             if (e.team === 'SYSTEM') return <div key={e.id} className="flex justify-center relative z-10"><span className="bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase px-3 py-1 rounded-full flex items-center gap-2">{e.type === 'VAR' ? <Video size={10} className="text-red-400"/> : <Megaphone size={10} />}{e.playerName || e.type}</span></div>;

             return (
               <div key={e.id} className={`flex items-center w-full relative z-10 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
                 <div className={`flex-1 ${isHome ? 'text-right pr-3' : 'text-left pl-3'}`}>
                    <div className={`inline-block py-1.5 px-3 rounded-lg border ${e.type === 'GOAL' ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-slate-900 border-slate-800'}`}>
                       <div className="font-bold text-xs text-slate-200">{e.type === 'GOAL' ? 'BUT !' : e.type}</div>
                       <div className="text-[10px] text-slate-400">{e.playerName}</div>
                    </div>
                 </div>
                 <div className="w-6 flex justify-center shrink-0">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold bg-slate-950 ${e.type === 'GOAL' ? 'border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-500'}`}>
                       {e.type === 'GOAL' ? '⚽' : e.type === 'CARD_YELLOW' ? <RectangleVertical size={10} className="fill-yellow-200"/> : e.minute}
                    </div>
                 </div>
                 <div className="flex-1"></div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};
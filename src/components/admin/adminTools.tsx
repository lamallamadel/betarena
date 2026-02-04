import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type {MatchEventType} from "../../types/types.ts";

interface AdminToolsProps {
  onAddEvent: (type: MatchEventType, team: 'HOME' | 'AWAY' | 'SYSTEM', player?: string) => void;
  onAdvanceTime: (min: number) => void;
}

export const AdminTools: React.FC<AdminToolsProps> = ({ onAddEvent, onAdvanceTime }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`shrink-0 bg-slate-950 border-t border-slate-800 transition-all duration-300 z-50 ${isOpen ? 'h-auto pb-4' : 'h-10'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center h-10 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300 gap-1 bg-slate-900/50"
      >
        {isOpen ? <ChevronDown size={12}/> : <ChevronUp size={12}/>}
        Simulateur / Admin
      </button>
      
      {isOpen && (
        <div className="px-4 pt-2 grid grid-cols-2 gap-2 animate-in slide-in-from-bottom-2">
          <button onClick={() => onAdvanceTime(5)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-700">+5 Min</button>
          <button onClick={() => onAddEvent('VAR', 'SYSTEM', 'Check VAR')} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-700">🖥️ VAR</button>
          <button onClick={() => onAddEvent('GOAL', 'HOME', 'Mbappé')} className="p-2 bg-indigo-900/30 border border-indigo-500/50 rounded text-xs text-indigo-300 hover:bg-indigo-900/50 font-bold">⚽ But Home</button>
          <button onClick={() => onAddEvent('GOAL', 'AWAY', 'Aubameyang')} className="p-2 bg-sky-900/30 border border-sky-500/50 rounded text-xs text-sky-300 hover:bg-sky-900/50 font-bold">⚽ But Away</button>
          <button onClick={() => onAddEvent('CARD_YELLOW', 'AWAY', 'Joueur')} className="p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-xs text-yellow-500 hover:bg-yellow-900/30">🟨 Jaune</button>
          <button onClick={() => onAddEvent('CARD_RED', 'HOME', 'Joueur')} className="p-2 bg-red-900/20 border border-red-600/30 rounded text-xs text-red-500 hover:bg-red-900/30">🟥 Rouge</button>
        </div>
      )}
    </div>
  );
};
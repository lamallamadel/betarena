import React, { useState } from 'react';
import { Lock, Coins } from 'lucide-react';
import type {Match, PredictionType} from "../../types/types.ts";

interface BettingFormProps {
  match: Match;
  predictions: Record<string, any>; // Paris existants
  onPlaceBet: (type: PredictionType, selection: string) => void;
  is1N2Locked: boolean;
  isScoreLocked: boolean;
  rules: any; // Coûts et gains
}

export const BettingForm: React.FC<BettingFormProps> = ({ 
  match, predictions, onPlaceBet, is1N2Locked, isScoreLocked, rules 
}) => {
  const [activeTab, setActiveTab] = useState<PredictionType>('1N2');
  const [tempScore, setTempScore] = useState({ home: 0, away: 0 });

  // Helpers d'affichage
  const isCurrentLocked = activeTab === '1N2' ? is1N2Locked : activeTab === 'EXACT_SCORE' ? isScoreLocked : false;
  const currentPrediction = predictions[activeTab];

  return (
    <div className="flex-1 p-4 flex flex-col space-y-4">
      
      {/* Tabs Navigation */}
      <div className="bg-slate-800 p-1 rounded-xl flex border border-slate-700">
        {['1N2', 'EXACT_SCORE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as PredictionType)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === '1N2' ? 'Vainqueur' : 'Score Exact'}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        
        {/* --- ONGLET 1N2 --- */}
        {activeTab === '1N2' && (
          <div className="grid grid-cols-3 gap-3">
            {['1', 'N', '2'].map((choice) => {
              const label = choice === '1' ? match.homeTeam : choice === 'N' ? 'Nul' : match.awayTeam;
              const isSelected = currentPrediction?.selection === choice;
              
              return (
                <button
                  key={choice}
                  disabled={isCurrentLocked}
                  onClick={() => onPlaceBet('1N2', choice)}
                  className={`py-4 rounded-xl border-2 font-bold transition-all relative ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                  } ${isCurrentLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-xl mb-1">{choice}</div>
                  <div className="text-[9px] uppercase opacity-70 truncate px-1">{label}</div>
                  {isSelected && <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full"></div>}
                </button>
              );
            })}
          </div>
        )}

        {/* --- ONGLET SCORE EXACT --- */}
        {activeTab === 'EXACT_SCORE' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
             <div className="flex justify-center items-center gap-4 mb-6">
                <input 
                  type="number" min="0" 
                  value={tempScore.home}
                  onChange={(e) => setTempScore({ ...tempScore, home: parseInt(e.target.value) || 0 })}
                  className="w-16 h-16 bg-slate-800 rounded-xl text-center text-3xl font-black text-white border border-slate-700 focus:border-indigo-500 outline-none"
                  disabled={isCurrentLocked}
                />
                <span className="text-slate-500 font-bold">-</span>
                <input 
                  type="number" min="0" 
                  value={tempScore.away}
                  onChange={(e) => setTempScore({ ...tempScore, away: parseInt(e.target.value) || 0 })}
                  className="w-16 h-16 bg-slate-800 rounded-xl text-center text-3xl font-black text-white border border-slate-700 focus:border-indigo-500 outline-none"
                  disabled={isCurrentLocked}
                />
             </div>
             
             {!isCurrentLocked ? (
               <button 
                 onClick={() => onPlaceBet('EXACT_SCORE', `${tempScore.home}-${tempScore.away}`)}
                 className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
               >
                 <span>Valider {tempScore.home}-{tempScore.away}</span>
                 <span className="bg-indigo-800 px-2 py-0.5 rounded text-[10px] text-indigo-200">-{rules.COST} 🟡</span>
               </button>
             ) : (
                <div className="text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                  <Lock size={14}/> Modifications fermées
                </div>
             )}
             
             {currentPrediction && (
               <div className="mt-4 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg">
                 Mon prono actuel : <span className="text-white font-bold">{currentPrediction.selection}</span>
               </div>
             )}
          </div>
        )}

        {/* --- INFOS & LOCKS --- */}
        {isCurrentLocked && !currentPrediction && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <Lock className="text-red-400 shrink-0" size={20} />
            <div className="text-xs text-red-200">
              <strong className="block mb-0.5 text-red-100">Paris fermés</strong>
              {activeTab === '1N2' ? "Le match a commencé (RG-A01)." : "La 2ème mi-temps a commencé (RG-A02)."}
            </div>
          </div>
        )}
        
        {!isCurrentLocked && (
             <div className="mt-4 flex justify-center items-center gap-2 text-[10px] text-slate-500">
               <Coins size={12} className="text-yellow-500"/>
               <span>Coût : {rules.COST} | Gain pot. : {rules.GAINS[activeTab]}</span>
             </div>
        )}

      </div>
    </div>
  );
};
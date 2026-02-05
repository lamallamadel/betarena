import React from 'react';
import { Instagram, XCircle } from 'lucide-react';

interface ShareStoryModalProps {
    user: any;
    selectedMatch: any;
    selectedOdd: any;
    betAmount: number;
    onClose: () => void;
}

export const ShareStoryModal: React.FC<ShareStoryModalProps> = ({ user, selectedMatch, selectedOdd, betAmount, onClose }) => (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in">
        <div className="w-[85%] max-w-sm bg-gradient-to-br from-emerald-600 via-slate-900 to-black rounded-[32px] p-1 border border-emerald-500/30 shadow-2xl">
            <div className="bg-slate-950/50 backdrop-blur-sm rounded-[30px] p-6 flex flex-col items-center text-center h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

                <div className="w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center text-3xl bg-slate-800 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-4">
                    {user.avatar}
                </div>

                <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1">PARI VALIDÉ !</h2>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-6">BetArena Official</p>

                <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xl">{selectedMatch.homeLogo}</span>
                        <span className="text-sm font-black text-white">VS</span>
                        <span className="text-xl">{selectedMatch.awayLogo}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-300 uppercase mb-2">{selectedMatch.home} - {selectedMatch.away}</div>
                    <div className="h-px w-full bg-white/10 mb-2" />
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 uppercase">Cote Totale</span>
                        <span className="text-lg font-black text-emerald-500">{selectedOdd?.val}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-slate-400 uppercase">Gain Potentiel</span>
                        <span className="text-lg font-black text-yellow-500">{Math.floor(betAmount * selectedOdd?.val)} <span className="text-[10px]">🪙</span></span>
                    </div>
                </div>

                <div className="flex gap-2 w-full">
                    <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
                        <Instagram size={16} /> STORY
                    </button>
                    <button onClick={onClose} className="w-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-colors">
                        <XCircle size={20} />
                    </button>
                </div>
            </div>
        </div>
    </div>
);

import React, { useState } from 'react';
import { X, Trophy, Share2 } from 'lucide-react';

interface ShareData {
  type: 'WIN' | 'PRONO' | 'RANK';
  title: string;
  subtitle: string;
  value: string | number;
  accentColor: string;
}

interface ShareModalProps {
  data: ShareData;
  pseudo: string;
  onClose: () => void;
  onConfirmShare: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ data, pseudo, onClose, onConfirmShare }) => {
  const [template, setTemplate] = useState<'NEON' | 'PITCH' | 'GOLD'>('NEON');

  // Simulation du partage natif
  const handleNativeShare = async () => {
    const text = `BetArena 🏆 ${data.title} : ${data.value} !`;
    if (navigator.share) {
      try { await navigator.share({ title: 'BetArena', text, url: window.location.href }); } catch (e) {}
    } else {
      try { await navigator.clipboard.writeText(text); alert("Lien copié !"); } catch (e) {}
    }
    onConfirmShare(); // Déclenche la récompense
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-white/50 hover:text-white bg-black/20 p-1 rounded-full"><X size={20} /></button>
        
        {/* Visual Card */}
        <div className={`relative aspect-[4/5] p-6 flex flex-col justify-between items-center text-center transition-colors duration-500 ${
          template === 'NEON' ? 'bg-gradient-to-br from-violet-900 via-slate-900 to-indigo-900' :
          template === 'PITCH' ? 'bg-gradient-to-br from-emerald-900 via-green-950 to-slate-900' :
          'bg-gradient-to-br from-slate-900 via-amber-950 to-yellow-900'
        }`}>
          {/* Header Card */}
          <div className="relative z-10 flex items-center gap-2 mb-4">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20"><Trophy size={24} className="text-white" /></div>
            <span className="font-black text-xl tracking-tighter text-white">BetArena</span>
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center w-full">
            <div className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">{data.subtitle}</div>
            <h2 className="text-3xl font-black text-white leading-none mb-4 italic uppercase">{data.title}</h2>
            <div className={`text-6xl font-black font-mono tracking-tighter ${data.accentColor} drop-shadow-2xl`}>{data.value}</div>
            {data.type === 'WIN' && <div className="mt-4 px-4 py-1 bg-white/10 rounded-full inline-block backdrop-blur text-xs font-bold text-white border border-white/20">🔥 {pseudo} est en feu !</div>}
          </div>

          {/* Footer Card */}
          <div className="relative z-10 w-full pt-6 border-t border-white/10 flex justify-between items-end">
            <div className="text-left"><div className="text-[10px] text-white/50 font-bold uppercase">Rejoins-moi</div><div className="text-xs text-white font-bold">betarena.app</div></div>
            <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center font-bold text-black text-[8px]">QR</div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-950">
          <div className="flex justify-center gap-3 mb-4">
            {['NEON', 'PITCH', 'GOLD'].map((t) => (
              <button key={t} onClick={() => setTemplate(t as any)} className={`w-8 h-8 rounded-full border-2 ${template === t ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: t === 'NEON' ? '#6366f1' : t === 'PITCH' ? '#10b981' : '#f59e0b' }} />
            ))}
          </div>
          <button onClick={handleNativeShare} className="w-full bg-white text-slate-950 font-black uppercase py-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
            <Share2 size={18} /> Partager (+10 Coins)
          </button>
        </div>
      </div>
    </div>
  );
};
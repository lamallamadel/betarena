import React, { useRef, useState } from 'react';
import { X, Share2, Check, Palette, Moon, Shield } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { useSocialShare } from '../../hooks/useSocialShare';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  user: any;
  bet?: any;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, match, user, bet }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shared, setShared] = useState(false);
  const [template, setTemplate] = useState<'classic' | 'dark' | 'club'>('classic');

  // Logic Hook
  const { canReward, cooldownLeft, recordShare } = useSocialShare(user.uid, user);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Generate Image
      const blob = await toBlob(cardRef.current, { quality: 0.95 });
      if (blob) {
        // 2. Share
        if (navigator.share) {
          const file = new File([blob], 'betarena-share.png', { type: 'image/png' });
          await navigator.share({
            title: 'BetArena Performance',
            text: `Mon prono sur ${match.home} vs ${match.away} ! 🔥`,
            files: [file]
          });

          // 3. Record & Reward
          await recordShare();
          setShared(true);
        } else {
          // Fallback
          const link = document.createElement('a');
          link.download = 'betarena-share.png';
          link.href = URL.createObjectURL(blob);
          link.click();
          // Still record for web users if they strictly downloaded? Maybe not ideal but ok for proto
          await recordShare();
          setShared(true);
        }
      }
    } catch (err) {
      console.error('Share failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Template Styles
  const getTemplateStyle = () => {
    switch (template) {
      case 'dark': return 'bg-slate-950 border-slate-800 text-white';
      case 'club': return 'bg-emerald-900 border-emerald-700 text-white'; // Fallback to emerald if no homeColor
      default: return 'bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/30 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm m-4 relative shadow-2xl flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-20">
          <X size={24} />
        </button>

        <h2 className="text-xl font-black text-white uppercase text-center mb-6 tracking-wide shrink-0">
          Partager ma Perf'
        </h2>

        {/* PREVIEW SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center">

          {/* CAPTURE ZONE */}
          <div className="relative mb-6 shrink-0 transform scale-95 origin-top">
            <div ref={cardRef} className={`w-[320px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border relative flex flex-col ${getTemplateStyle()}`}>
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

              {/* Header */}
              <div className="p-6 flex justify-between items-start relative z-10">
                <div className="text-emerald-500 font-black tracking-tighter text-2xl">BETARENA</div>
                {template === 'club' && <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase">Club Edition</div>}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 space-y-6">
                {/* Match Logos */}
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-5xl drop-shadow-lg transform -rotate-6">{match.homeLogo}</span>
                    <span className="text-xs font-black uppercase mt-2 opacity-80">{match.home}</span>
                  </div>
                  <span className="text-2xl font-black text-slate-500">VS</span>
                  <div className="flex flex-col items-center">
                    <span className="text-5xl drop-shadow-lg transform rotate-6">{match.awayLogo}</span>
                    <span className="text-xs font-black uppercase mt-2 opacity-80">{match.away}</span>
                  </div>
                </div>

                {/* Score / Time */}
                <div className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex flex-col items-center">
                  <span className="text-4xl font-black tracking-tighter tabular-nums text-white">
                    {match.score?.h ?? 0} - {match.score?.a ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    {match.status === 'LIVE' ? 'En Direct 🔥' : 'Résultat Final'}
                  </span>
                </div>
              </div>

              {/* Footer User */}
              <div className="p-6 bg-black/20 backdrop-blur-sm mt-auto relative z-10 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-white font-bold">
                      {user.pseudo?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">{user.pseudo}</span>
                      <span className="text-[10px] uppercase text-emerald-400 font-bold">@BetArena_App</span>
                    </div>
                  </div>
                  {bet && (
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold uppercase opacity-60">Gain</span>
                      <span className="text-xl font-black text-yellow-400">+{bet.potentialGain} 🪙</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mention Légale Integrated */}
              <div className="absolute bottom-0 w-full text-center py-1 opacity-40 text-[6px] uppercase font-bold z-0">
                Jouer comporte des risques : endettement, isolement...
              </div>
            </div>
          </div>

          {/* TEMPLATE SELECTOR */}
          <div className="flex gap-2 mb-6 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button onClick={() => setTemplate('classic')} className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${template === 'classic' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-700'}`}>
              <Palette size={14} /> Classique
            </button>
            <button onClick={() => setTemplate('dark')} className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${template === 'dark' ? 'bg-slate-950 text-white border border-slate-600 shadow-lg' : 'text-slate-500 hover:bg-slate-700'}`}>
              <Moon size={14} /> Dark
            </button>
            <button onClick={() => setTemplate('club')} className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${template === 'club' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-700'}`}>
              <Shield size={14} /> Club
            </button>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="mt-auto pt-4 border-t border-slate-800 shrink-0">
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg
                ${isGenerating ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-black'}
            `}
          >
            {isGenerating ? (
              <span className="animate-pulse">Génération de l'image...</span>
            ) : shared ? (
              <> <Check size={20} /> Partagé ! </>
            ) : (
              <> <Share2 size={20} /> Partager {canReward && <span className="bg-black/20 px-2 py-0.5 rounded text-[10px] ml-1">+10 🪙</span>} </>
            )}
          </button>

          {/* Cooldown / Reward Info */}
          <div className="mt-3 text-center min-h-[20px]">
            {shared && canReward && (
              <p className="text-[10px] font-bold text-emerald-400 animate-in slide-in-from-bottom fade-in">
                🎉 +10 Coins ajoutés à ton solde !
              </p>
            )}
            {!canReward && cooldownLeft > 0 && (
              <p className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
                ⏳ Prochaine récompense dans {Math.floor(cooldownLeft / 60)}m {cooldownLeft % 60}s
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
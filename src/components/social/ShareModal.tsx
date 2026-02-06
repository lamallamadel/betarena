import React, { useRef, useState } from 'react';
import { X, Share2, Download, Instagram, Check } from 'lucide-react';
import { toBlob } from 'html-to-image';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any; // Simplified type
  user: any;
  bet?: any; // To show "Gain" if resolved
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, match, user, bet }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shared, setShared] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      const blob = await toBlob(cardRef.current, { quality: 0.95 });
      if (blob) {
        // Navigator Share API
        if (navigator.share) {
          const file = new File([blob], 'betarena-share.png', { type: 'image/png' });
          await navigator.share({
            title: 'BetArena Performance',
            text: `J'ai pronostiqué sur ${match.home} vs ${match.away} ! 🔥`,
            files: [file]
          });
          setShared(true);
        } else {
          // Fallback Download
          const link = document.createElement('a');
          link.download = 'betarena-share.png';
          link.href = URL.createObjectURL(blob);
          link.click();
          setShared(true);
        }
      }
    } catch (err) {
      console.error('Share failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm m-4 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={24} />
        </button>

        <h2 className="text-xl font-black text-white uppercase text-center mb-6 tracking-wide">
          Partager ma Perf'
        </h2>

        {/* AREA TO CAPTURE */}
        <div ref={cardRef} className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

          <div className="p-6 flex flex-col items-center relative z-10">
            {/* Logo */}
            <div className="text-emerald-500 font-black tracking-tighter text-2xl mb-4">BETARENA</div>

            {/* Match */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl">{match.homeLogo}</span>
              <div className="text-2xl font-black text-white">{match.score?.h ?? 0} - {match.score?.a ?? 0}</div>
              <span className="text-3xl">{match.awayLogo}</span>
            </div>
            <div className="text-xs text-slate-400 font-bold uppercase mb-6">{match.home} vs {match.away}</div>

            {/* User Perf */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs border-2 border-slate-900">
                  {user.pseudo?.[0] || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-300 font-bold">{user.pseudo}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Rank #120</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Gain Potentiel</span>
                <span className="text-xl font-black text-yellow-400">
                  {bet ? bet.potentialGain : '---'} 🪙
                </span>
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="bg-black/40 p-2 text-center">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Rejoins-moi sur l'app !</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="animate-pulse">Génération...</span>
            ) : shared ? (
              <> <Check size={20} /> Partagé ! (+10 Coins) </>
            ) : (
              <> <Share2 size={20} /> Partager la Story </>
            )}
          </button>
          {shared && (
            <p className="text-[10px] text-center text-emerald-500 font-bold animate-pulse">
              Récompense débloquée !
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Trophy, User, Gift, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Onboarding = () => {
  const { completeOnboarding } = useAuth();
  const [pseudo, setPseudo] = useState("");
  const [referral, setReferral] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!pseudo.trim()) {
      setError("Veuillez entrer un pseudo");
      return;
    }

    if (pseudo.trim().length < 3) {
      setError("Le pseudo doit contenir au moins 3 caractères");
      return;
    }

    try {
      await completeOnboarding(pseudo, referral);
    } catch (e: any) {
      setError("Erreur : " + e.message);
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col relative overflow-hidden font-sans">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 relative">

        <div className="mb-8 animate-in fade-in zoom-in duration-700">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-3xl shadow-2xl shadow-indigo-500/30 mb-6 inline-block transform rotate-3">
            <Trophy size={48} className="text-white drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">BetArena</h1>
          <p className="text-indigo-200/70 text-sm font-medium">La référence du pronostic social.</p>
        </div>

        <div className="w-full max-w-sm bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-700 delay-200">

          <h2 className="text-xl font-bold text-white mb-6">Créer votre profil</h2>

          <div className="space-y-5">
            <div className="text-left group">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1.5 block group-focus-within:text-indigo-400 transition-colors">Votre Pseudo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="text"
                  value={pseudo}
                  onChange={e => setPseudo(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="Ex: Zizou98"
                />
              </div>
            </div>

            <div className="text-left group">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1.5 block group-focus-within:text-emerald-400 transition-colors">Code Parrain <span className="text-slate-600 normal-case font-normal">(Optionnel)</span></label>
              <div className="relative">
                <Gift className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${referral.length > 3 ? 'text-emerald-400' : 'text-slate-500'}`} size={18} />
                <input
                  type="text"
                  value={referral}
                  onChange={e => setReferral(e.target.value)}
                  className={`w-full bg-slate-950/50 border rounded-2xl pl-11 pr-4 py-3.5 text-white outline-none transition-all ${referral.length > 3 ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-slate-700 focus:border-indigo-500'}`}
                  placeholder="Ex: PRO-1234"
                />
              </div>
              {referral.length > 3 && (
                <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 size={10} /> Code valide : Bonus activé !
                </p>
              )}
            </div>

            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!pseudo.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all transform active:scale-[0.98] disabled:active:scale-100 mt-2"
            >
              Entrer dans l'arène
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] text-slate-600 uppercase font-bold">Ou continuer avec</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <div className="flex gap-3 mt-4 justify-center">
            <button className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 opacity-80 hover:opacity-100" alt="Google" /></button>
            <button className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"><img src="https://www.svgrepo.com/show/475647/apple-color.svg" className="w-5 h-5 invert opacity-80 hover:opacity-100" alt="Apple" /></button>
          </div>

        </div>

        <p className="text-slate-500 text-xs mt-8">
          En continuant, vous acceptez nos <span className="underline cursor-pointer hover:text-slate-300">CGU</span>.
        </p>
      </div>
    </div>
  );
};
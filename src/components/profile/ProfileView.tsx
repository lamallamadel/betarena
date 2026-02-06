import { ChevronLeft, Settings, ShieldCheck, Activity, TrendingUp, Target, Trophy, Gift, Copy } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, APP_ID } from '../../config/firebase';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { ProgressBar } from '../ui/ProgressBar';

import type { RichUserProfile } from '../../types/types';

interface ProfileViewProps {
    user: RichUserProfile;
    onNavigate: (view: 'LIVE' | 'PREDICT' | 'SOCIAL' | 'SHOP' | 'RANK' | 'PROFILE' | 'HOME') => void;
}


// ... imports

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onNavigate }) => {

    const handleDeleteProfile = async () => {
        if (window.confirm("⚠️ Supprimer le profil et recommencer l'Onboarding ?")) {
            try {
                const userRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'profile');
                await deleteDoc(userRef);
                await signOut(auth);
                window.location.reload();
            } catch (e) {
                console.error("Erreur lors de la suppression du profil:", e);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up overflow-y-auto no-scrollbar pb-24">
            {/* Header Profil Premium */}
            <div className="p-6 pt-12 bg-gradient-to-b from-emerald-500/10 via-slate-950 to-slate-950 border-b border-slate-900 flex flex-col items-center">
                <div className="flex justify-between w-full mb-8">
                    <button onClick={() => onNavigate('HOME')} className="p-2.5 bg-slate-900/50 rounded-full border border-slate-800"><ChevronLeft size={20} /></button>
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Profil Joueur</h2>
                    <button onClick={handleDeleteProfile} className="p-2.5 bg-slate-900/50 rounded-full border border-slate-800 text-red-500"><Settings size={20} /></button>
                </div>

                <div className="relative mb-6">
                    <AvatarDisplay
                        size="w-32 h-32"
                        avatar={user.avatar}
                        frame={user.frame}
                        level={user.level}
                        showShop={true}
                        onShopClick={() => onNavigate('SHOP')}
                    />
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    {user.username} <ShieldCheck size={20} className="text-emerald-500" />
                </h3>

                <div className="flex gap-1.5 mt-4">
                    {user.badges.map((b, i) => (
                        <div key={i} className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 shadow-xl text-xl hover:scale-110 transition-transform cursor-pointer">{b}</div>
                    ))}
                </div>

                <div className="w-full mt-8 bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                        <span>Niveau {user.level}</span>
                        <span className="text-emerald-500">{user.xp}% vers Niv. {user.level + 1}</span>
                    </div>
                    <ProgressBar value={user.xp} />
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Dashboard Statistiques */}
                <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Analyse Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Paris Totaux', val: user.stats.totalPredictions, icon: Activity, col: 'text-emerald-500' },
                            { label: 'Win Rate', val: user.stats.winRate, icon: TrendingUp, col: 'text-yellow-500' },
                            { label: 'Précision Score', val: user.stats.precision, icon: Target, col: 'text-red-500' },
                            { label: 'Rang Global', val: user.stats.rank, icon: Trophy, col: 'text-white' },
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center gap-4 hover:border-slate-700 transition-colors">
                                <div className={`p-2.5 rounded-2xl bg-slate-950 ${s.col}/10 ${s.col}`}><s.icon size={18} /></div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase block leading-tight">{s.label}</span>
                                    <span className="text-lg font-black text-white">{s.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Module Parrainage */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-800 p-6 rounded-[32px] text-black relative overflow-hidden shadow-xl shadow-emerald-500/10 group active:scale-[0.98] transition-all">
                    <Gift size={100} className="absolute -right-6 -bottom-6 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                    <div className="relative z-10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Bonus Parrainage</h4>
                        <p className="text-xl font-black mb-4 tracking-tighter leading-tight">Gagnez 1000 Coins <br />par ami parrainé</p>
                        <div className="bg-black/10 p-3.5 rounded-2xl flex items-center justify-between border border-white/20 backdrop-blur-sm">
                            <span className="text-sm font-black tracking-widest">{user.referralCode}</span>
                            <Copy size={18} className="cursor-pointer active:scale-90 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Historique des Paris */}
                <div>
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Activité Récente</h4>
                        <span className="text-[9px] font-black text-emerald-500 cursor-pointer">TOUT VOIR</span>
                    </div>

                    <div className="space-y-3">
                        {user.predictions.length > 0 ? user.predictions.map((p: any) => (
                            <div key={p.id} className={`bg-slate-900 border-2 p-5 rounded-[32px] flex items-center justify-between group hover:border-slate-700 transition-all ${p.status === 'WON' ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent' :
                                p.status === 'LOST' ? 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent' :
                                    p.status === 'VOID' ? 'border-slate-700 bg-slate-950' :
                                        'border-slate-800'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${p.status === 'WON' ? 'bg-emerald-500 text-black' :
                                        p.status === 'LOST' ? 'bg-red-500 text-white' :
                                            p.status === 'VOID' ? 'bg-slate-700 text-slate-400' :
                                                'bg-slate-950 text-yellow-500 animate-pulse'
                                        }`}>
                                        {p.status === 'WON' ? '✓' :
                                            p.status === 'LOST' ? '✗' :
                                                p.status === 'VOID' ? '↩' :
                                                    '⏳'}
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black text-white uppercase tracking-tight mb-1">{p.match}</h5>

                                        {/* Détail du résultat si résolu */}
                                        {p.is_settled && p.match_final_score && (
                                            <p className="text-[9px] font-bold text-slate-400 mb-1">
                                                Score final : {p.match_final_score}
                                                {p.match_had_penalty_shootout && ' (TAB)'}
                                                {p.match_had_extra_time && !p.match_had_penalty_shootout && ' (a.p.)'}
                                            </p>
                                        )}

                                        <p className="text-[10px] font-bold uppercase mt-1 flex items-center gap-1">
                                            <span className={p.type === 'EXACT_SCORE' ? 'text-purple-400' : 'text-blue-400'}>
                                                {p.type === 'EXACT_SCORE' ? '🎯' : '🏆'}
                                            </span>
                                            <span className="text-slate-500">
                                                {p.type === 'EXACT_SCORE' ? 'Score' : '1N2'}: {p.selection}
                                            </span>
                                            <span className="text-slate-600">(@{p.odd})</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {/* Affichage du gain/perte */}
                                    {p.status === 'WON' && (
                                        <div className="text-base font-black text-emerald-500 mb-1">
                                            +{p.gain}
                                        </div>
                                    )}
                                    {p.status === 'LOST' && (
                                        <div className="text-base font-black text-red-500 mb-1">
                                            -{p.amount}
                                        </div>
                                    )}
                                    {p.status === 'VOID' && (
                                        <div className="text-xs font-black text-slate-500 mb-1">
                                            Remboursé
                                        </div>
                                    )}
                                    {p.status === 'PENDING' && (
                                        <div className="text-xs font-black text-yellow-500 mb-1">
                                            -{p.amount}
                                        </div>
                                    )}

                                    {/* Badge de statut */}
                                    <span className={`text-[8px] font-black px-2 py-1 rounded inline-block uppercase tracking-widest ${p.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse' :
                                        p.status === 'WON' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            p.status === 'LOST' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                'bg-slate-800 text-slate-500 border border-slate-700'
                                        }`}>
                                        {p.status === 'PENDING' ? '⏳ En cours' :
                                            p.status === 'WON' ? '✓ Gagné' :
                                                p.status === 'LOST' ? '✗ Perdu' :
                                                    '↩ Annulé'}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-600 text-xs py-10 font-bold uppercase tracking-widest">Aucun pari pour le moment</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

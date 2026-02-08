import React from 'react';
import { X, Trash2, Shield, LayoutDashboard, Database, RefreshCw } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, APP_ID } from '../../config/firebase';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userUid: string;
    isDebugMode: boolean;
    onToggleDebug: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    userUid,
    isDebugMode,
    onToggleDebug
}) => {
    if (!isOpen) return null;

    const handleDeleteProfile = async () => {
        if (window.confirm("⚠️ ATTENTION : Cette action est irréversible.\n\nVoulez-vous vraiment supprimer votre profil et recommencer l'Onboarding ?")) {
            try {
                const userRef = doc(db, 'artifacts', APP_ID, 'users', userUid, 'data', 'profile');
                await deleteDoc(userRef);
                await signOut(auth);
                window.location.reload();
            } catch (e) {
                console.error("Erreur lors de la suppression du profil:", e);
                alert("Erreur lors de la suppression du profil.");
            }
        }
    };

    const handleOpenAdminPanel = () => {
        // Redirige vers l'URL avec ?admin=true
        const url = new URL(window.location.href);
        url.searchParams.set('admin', 'true');
        window.location.href = url.toString();
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 rounded-t-[32px] sm:rounded-[32px] p-6 border-t sm:border border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom duration-300">
                
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Paramètres</h2>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">

                    {/* SECTION TEST & DEBUG */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Zone de Test</h3>
                        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                            
                            {/* Toggle Mode Debug */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                                        <Database size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Mode Simulateur</h4>
                                        <p className="text-[10px] text-slate-500">Affiche les outils de simu en match live</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={onToggleDebug}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${isDebugMode ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
                                >
                                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                </button>
                            </div>

                            {/* Accès Admin Panel */}
                            <button onClick={handleOpenAdminPanel} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                                        <LayoutDashboard size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Panel Admin Complet</h4>
                                        <p className="text-[10px] text-slate-500">Gestion des matchs et utilisateurs</p>
                                    </div>
                                </div>
                                <Shield size={16} className="text-slate-600" />
                            </button>

                             {/* Cleanup Cache (Optionnel) */}
                             <button onClick={() => window.location.reload()} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                                        <RefreshCw size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Recharger l'Application</h4>
                                        <p className="text-[10px] text-slate-500">Nettoyer les états locaux</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* SECTION DANGER */}
                    <div>
                        <h3 className="text-[10px] font-black text-red-500/50 uppercase tracking-widest mb-3 px-2">Zone de Danger</h3>
                        <button 
                            onClick={handleDeleteProfile}
                            className="w-full bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-red-500/20 hover:border-red-500/30 transition-all group"
                        >
                            <div className="p-2 bg-red-500/20 text-red-500 rounded-xl group-hover:scale-110 transition-transform">
                                <Trash2 size={18} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-bold text-red-500">Supprimer mon Compte</h4>
                                <p className="text-[10px] text-red-400/60">Action irréversible</p>
                            </div>
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-[9px] font-mono text-slate-700">v1.0.4 • Build 2026.02.08</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

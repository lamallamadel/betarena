import React from 'react';
import { Shield, Clock, AlertTriangle } from 'lucide-react';

interface MaintenanceModeProps {
    message?: string;
}

export const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ 
    message = "L'application est actuellement en maintenance. Nous serons de retour bientôt." 
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                        <Shield size={40} className="text-amber-500" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-black text-white mb-3">
                        Maintenance en cours
                    </h1>

                    {/* Message */}
                    <p className="text-slate-400 mb-6 leading-relaxed">
                        {message}
                    </p>

                    {/* Status Indicators */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
                            <Clock size={16} />
                            <span>Durée estimée : quelques minutes</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-sm text-emerald-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span>Systèmes en mise à jour</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-800">
                        <p className="text-xs text-slate-500">
                            Merci de votre patience
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-amber-300">
                        <p className="font-semibold mb-1">Astuce</p>
                        <p className="text-amber-400/80">
                            Rechargez cette page dans quelques instants pour vérifier si la maintenance est terminée.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

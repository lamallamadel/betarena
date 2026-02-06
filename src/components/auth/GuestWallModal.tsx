import React from 'react';
import { X, Star, UserPlus, LogIn } from 'lucide-react';

interface GuestWallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin?: () => void;
    onSignup?: () => void;
}

/**
 * Modale d'incitation à l'inscription pour les invités
 * S'affiche quand un guest tente d'ajouter un favori
 */
export const GuestWallModal: React.FC<GuestWallModalProps> = ({
    isOpen,
    onClose,
    onLogin,
    onSignup
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6 pb-10 animate-slide-up">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Star size={32} className="text-yellow-400 fill-yellow-400" />
                </div>

                {/* Content */}
                <h2 className="text-xl font-black text-white text-center mb-2">
                    Personnalisez votre expérience
                </h2>
                <p className="text-sm text-slate-400 text-center mb-6">
                    Créez un compte pour épingler vos équipes favorites et ne rien rater de leurs matchs.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onSignup}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                    >
                        <UserPlus size={18} />
                        S'inscrire gratuitement
                    </button>
                    <button
                        onClick={onLogin}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                    >
                        <LogIn size={18} />
                        J'ai déjà un compte
                    </button>
                </div>

                {/* Swipe indicator */}
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-6" />
            </div>
        </div>
    );
};

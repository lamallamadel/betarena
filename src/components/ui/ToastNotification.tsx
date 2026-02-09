import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface ToastNotificationProps {
    message: string;
    show: boolean;
    type?: 'success' | 'warning' | 'error' | 'info';
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ 
    message, 
    show, 
    type = 'success' 
}) => {
    if (!show) return null;

    const getStyles = () => {
        switch (type) {
            case 'warning':
                return 'bg-yellow-900/90 border-yellow-500 shadow-yellow-500/20';
            case 'error':
                return 'bg-red-900/90 border-red-500 shadow-red-500/20';
            case 'info':
                return 'bg-blue-900/90 border-blue-500 shadow-blue-500/20';
            default:
                return 'bg-slate-900 border-emerald-500 shadow-emerald-500/20';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return <AlertTriangle size={18} className="text-yellow-400" />;
            case 'error':
                return <XCircle size={18} className="text-red-400" />;
            case 'info':
                return <Info size={18} className="text-blue-400" />;
            default:
                return <CheckCircle size={18} className="text-emerald-400" />;
        }
    };

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-slide-up px-4 max-w-md w-full">
            <div className={`${getStyles()} border-2 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3`}>
                {getIcon()}
                <p className="text-sm font-black text-white flex-1">{message}</p>
            </div>
        </div>
    );
};

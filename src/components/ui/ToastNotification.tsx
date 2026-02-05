import React from 'react';

interface ToastNotificationProps {
    message: string;
    show: boolean;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, show }) => {
    if (!show) return null;
    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
            <div className="bg-slate-900 border-2 border-emerald-500 px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-500/20 backdrop-blur-md">
                <p className="text-sm font-black text-white">{message}</p>
            </div>
        </div>
    );
};

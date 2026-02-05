import React from 'react';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';

interface NotificationsOverlayProps {
    onClose: () => void;
}

export const NotificationsOverlay: React.FC<NotificationsOverlayProps> = ({ onClose }) => (
    <div className="absolute top-24 left-5 right-5 bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl z-[100] p-6 animate-slide-up max-h-[60%] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Centre d'alertes</h4>
            <button onClick={onClose} className="text-[10px] font-black text-slate-500 uppercase">Fermer</button>
        </div>
        <div className="space-y-4">
            {MOCK_NOTIFICATIONS.map(n => (
                <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.read ? 'bg-slate-950 border-slate-800' : 'bg-slate-800 border-emerald-500/50 shadow-lg'}`}>
                    <h5 className={`text-[10px] font-black mb-1 ${n.type === 'SUCCESS' ? 'text-emerald-500' : 'text-blue-500'}`}>{n.title}</h5>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{n.text}</p>
                    <span className="text-[8px] text-slate-600 font-bold mt-2 block">{n.time}</span>
                </div>
            ))}
        </div>
    </div>
);

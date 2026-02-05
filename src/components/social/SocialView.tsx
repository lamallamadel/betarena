import React, { useState } from 'react';
import { Hash, Users, Plus, ChevronRight } from 'lucide-react';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { MOCK_CHAT_GLOBAL, MOCK_GROUPS } from '../../data/mockData';

export const SocialView: React.FC = () => {
    const [activeSocialTab, setActiveSocialTab] = useState<'chat' | 'groups'>('chat');

    return (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up">
            <header className="p-6 pt-12 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Social</h2>
                <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
                    <button onClick={() => setActiveSocialTab('chat')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSocialTab === 'chat' ? 'bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-500'}`}><Hash size={14} /> Chat Global</button>
                    <button onClick={() => setActiveSocialTab('groups')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSocialTab === 'groups' ? 'bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-500'}`}><Users size={14} /> Mes Groupes</button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 no-scrollbar pb-24">
                {activeSocialTab === 'chat' ? (
                    <div className="space-y-6">
                        {MOCK_CHAT_GLOBAL.map(chat => (
                            <div key={chat.id} className="flex gap-4 group animate-slide-up">
                                <AvatarDisplay avatar={chat.avatar as any} frame="border-slate-800" level={chat.level} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase">{chat.user}</span>
                                        <span className="text-[8px] font-bold text-slate-600">{chat.time}</span>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-xs text-slate-300 leading-relaxed">
                                        {chat.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button className="w-full bg-slate-900 border-2 border-dashed border-slate-800 p-5 rounded-[32px] flex items-center justify-center gap-2 text-slate-500 font-black text-[10px] uppercase hover:border-emerald-500/50 hover:text-emerald-500 transition-all">
                            <Plus size={18} /> Créer un groupe
                        </button>
                        {MOCK_GROUPS.map(group => (
                            <div key={group.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-2xl border border-slate-800 shadow-inner">{group.icon}</div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase">{group.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{group.members} Membres</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Hash, Users, Plus, ChevronRight, Send, Lock, AlertTriangle } from 'lucide-react';
import { MOCK_GROUPS } from '../../data/mockData';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';

export const SocialView: React.FC = () => {
    const { user: authUser, profile } = useAuth();
    const [activeSocialTab, setActiveSocialTab] = useState<'chat' | 'groups'>('chat');
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Guest mode if no auth user
    const isGuest = !authUser?.uid;

    // Hook into global chat
    const { messages, sendMessage, reportMessage, chatEndRef, usersOnline } = useChat(
        'GLOBAL',
        authUser ? { uid: authUser.uid } : null,
        profile,
        isGuest
    );

    const handleSend = async () => {
        if (!input.trim()) return;
        setError(null);
        try {
            await sendMessage(input, 'TEXT');
            setInput('');
        } catch (e: any) {
            setError(e.message);
        }
    };

    // For relative time updates
    const [now, setNow] = useState(Date.now());
    React.useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Format timestamp to relative time
    const formatTime = (timestamp: number) => {
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "à l'instant";
        if (minutes < 60) return `il y a ${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `il y a ${hours}h`;
        return `il y a ${Math.floor(hours / 24)}j`;
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up">
            <header className="p-6 pt-12 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Social</h2>
                    {activeSocialTab === 'chat' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400">{usersOnline}</span>
                            <Users size={12} className="text-slate-500" />
                        </div>
                    )}
                </div>
                <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
                    <button onClick={() => setActiveSocialTab('chat')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSocialTab === 'chat' ? 'bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-500'}`}><Hash size={14} /> Chat Global</button>
                    <button onClick={() => setActiveSocialTab('groups')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSocialTab === 'groups' ? 'bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-500'}`}><Users size={14} /> Mes Groupes</button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                {activeSocialTab === 'chat' ? (
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="text-center text-slate-500 py-8">
                                <Hash size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-medium">Aucun message</p>
                                <p className="text-xs">Soyez le premier à écrire !</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className="flex gap-3 group animate-slide-up">
                                    <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-lg shrink-0 border border-slate-700">
                                        👤
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase">{msg.pseudo}</span>
                                            <span className="text-[8px] font-bold text-slate-600">{formatTime(msg.timestamp)}</span>
                                        </div>
                                        {msg.isReported ? (
                                            <div className="flex items-center gap-2 text-yellow-500 bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-xs italic">
                                                <AlertTriangle size={14} /> Message signalé
                                            </div>
                                        ) : (
                                            <div
                                                className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-xs text-slate-300 leading-relaxed cursor-pointer"
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    if (window.confirm("Signaler ce message ?")) {
                                                        reportMessage(msg.id);
                                                    }
                                                }}
                                            >
                                                {msg.type === 'GIF' ? (
                                                    <img src={msg.content} alt="GIF" className="rounded-lg max-w-[200px]" />
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
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

            {/* Input zone (only for chat tab) */}
            {activeSocialTab === 'chat' && (
                isGuest ? (
                    <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-2 shrink-0">
                        <Lock size={16} className="text-slate-500" />
                        <span className="text-sm text-slate-500 font-medium">Connectez-vous pour participer !</span>
                    </div>
                ) : (
                    <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
                        {error && (
                            <div className="text-xs text-red-400 mb-2 px-2">{error}</div>
                        )}
                        <div className="flex gap-2">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 text-sm h-10 focus:border-indigo-500 outline-none text-white placeholder-slate-500"
                                placeholder="Message..."
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="bg-indigo-600 w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

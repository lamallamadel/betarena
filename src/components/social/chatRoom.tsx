import React, { useState } from 'react';
import { Send, Users, Image as ImageIcon, X, AlertTriangle, Lock } from 'lucide-react';

interface ChatRoomProps {
    messages: any[];
    onSendMessage: (txt: string, type?: 'TEXT' | 'GIF') => void;
    onReportMessage: (id: string) => void;
    activeRoom: string;
    setActiveRoom: (room: string) => void;
    chatEndRef: any;
    currentUserId?: string;
    matchId: string;
    usersOnline?: number;
    isGuest?: boolean;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
    messages,
    onSendMessage,
    onReportMessage,
    activeRoom,
    setActiveRoom,
    chatEndRef,
    currentUserId,
    matchId,
    usersOnline = 0,
    isGuest = false
}) => {
    const [input, setInput] = useState('');
    const [showGifPicker, setShowGifPicker] = useState(false);

    // Mock GIF list
    const MOCK_GIFS = [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDN6eW84eW84eW84eW84eW84eW84eW84eW84/3o7TKr3nzbh5JEttLO/giphy.gif",
        "https://media.giphy.com/media/l0HlHJGHe3yAMjfFK/giphy.gif",
        "https://media.giphy.com/media/3o7TKUM3IgJBX2as9O/giphy.gif",
        "https://media.giphy.com/media/l2JhtKvUjF7sBqQDe/giphy.gif"
    ];

    const send = () => {
        if (input.trim()) {
            onSendMessage(input, 'TEXT');
            setInput('');
        }
    };

    const sendGif = (url: string) => {
        onSendMessage(url, 'GIF');
        setShowGifPicker(false);
    };

    // On définit les salles disponibles dynamiquement
    const rooms = [
        { id: 'GLOBAL', label: 'Général' },
        { id: matchId, label: 'Match' } // L'ID de la room est l'ID du match (ex: m-PSG-OM-2024)
    ];

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
            {/* Header des onglets */}
            <div className="p-2 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div className="flex gap-2">
                    {rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setActiveRoom(room.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeRoom === room.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {room.label}
                        </button>
                    ))}
                </div>
                {/* Indicateur Live + Compteur Connectés (Real-time) */}
                <div className="flex items-center gap-1.5 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400">
                        {usersOnline}
                    </span>
                    <Users size={12} className="text-slate-500" />
                </div>
            </div>

            {/* Liste des messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                {messages.map(msg => {
                    const isMe = msg.userId === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isMe
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                }`}>
                                {!isMe && (
                                    <div className="text-[10px] text-slate-400 font-bold mb-0.5">
                                        {msg.pseudo}
                                    </div>
                                )}
                                {msg.isReported ? (
                                    <div className="flex items-center gap-2 text-yellow-500 italic">
                                        <AlertTriangle size={14} /> Message signalé
                                    </div>
                                ) : (
                                    <div onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (window.confirm("Signaler ce message ?")) {
                                            onReportMessage(msg.id);
                                        }
                                    }}>
                                        {msg.type === 'GIF' ? (
                                            <img src={msg.content} alt="GIF" className="rounded-lg max-w-[200px] max-h-[150px] object-cover mt-1" />
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {/* Input zone */}
            {isGuest ? (
                /* Guest Mode: Disabled input with lock message */
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-2">
                    <Lock size={16} className="text-slate-500" />
                    <span className="text-sm text-slate-500 font-medium">Connectez-vous pour participer !</span>
                </div>
            ) : (
                /* Connected Mode: Full input */
                <div className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2 relative">
                    {showGifPicker && (
                        <div className="absolute bottom-full left-2 mb-2 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-xl w-64 animate-slide-up z-10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400">GIFs</span>
                                <button onClick={() => setShowGifPicker(false)}><X size={14} className="text-slate-500" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 h-40 overflow-y-auto no-scrollbar">
                                {MOCK_GIFS.map((gif, i) => (
                                    <img
                                        key={i}
                                        src={gif}
                                        onClick={() => sendGif(gif)}
                                        className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setShowGifPicker(!showGifPicker)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showGifPicker ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        <ImageIcon size={18} />
                    </button>

                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 text-sm h-10 focus:border-indigo-500 outline-none text-white placeholder-slate-500"
                        placeholder="Message..."
                    />
                    <button
                        onClick={send}
                        disabled={!input.trim()}
                        className="bg-indigo-600 w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
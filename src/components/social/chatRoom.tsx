import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatRoomProps {
    messages: any[];
    onSendMessage: (txt: string) => void;
    activeRoom: string;
    setActiveRoom: (room: string) => void;
    chatEndRef: any;
    currentUserId?: string; // C'est celui qu'on passe depuis App.tsx
    matchId: string;        // INDISPENSABLE : Pour savoir quel est l'ID de la room du match
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
                                                      messages,
                                                      onSendMessage,
                                                      activeRoom,
                                                      setActiveRoom,
                                                      chatEndRef,
                                                      currentUserId,
                                                      matchId // On le récupère ici
                                                  }) => {
    const [input, setInput] = useState('');

    const send = () => {
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    // On définit les salles disponibles dynamiquement
    const rooms = [
        { id: 'GLOBAL', label: 'Général' },
        { id: matchId, label: 'Match' } // L'ID de la room est l'ID du match (ex: m-PSG-OM-2024)
    ];

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
            {/* Header des onglets */}
            <div className="p-2 border-b border-slate-800 flex gap-2 bg-slate-950">
                {rooms.map(room => (
                    <button
                        key={room.id}
                        onClick={() => setActiveRoom(room.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            activeRoom === room.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        {room.label}
                    </button>
                ))}
            </div>

            {/* Liste des messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                {messages.map(msg => {
                    const isMe = msg.userId === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                isMe
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-slate-800 text-slate-200 rounded-tl-none'
                            }`}>
                                {!isMe && (
                                    <div className="text-[10px] text-slate-400 font-bold mb-0.5">
                                        {msg.pseudo}
                                    </div>
                                )}
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef}/>
            </div>

            {/* Input zone */}
            <div className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
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
                    <Send size={16}/>
                </button>
            </div>
        </div>
    );
};
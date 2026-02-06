import React, { useRef, useEffect } from 'react';
import { Search, X, Clock, ChevronRight } from 'lucide-react';
import { useSearch, type SearchResult } from '../../hooks/useSearch';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (type: 'TEAM' | 'LEAGUE', id: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onNavigate }) => {
    const {
        query,
        setQuery,
        results,
        history,
        addToHistory,
        clearHistory
    } = useSearch();

    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery(''); // Reset on close
        }
    }, [isOpen, setQuery]);

    if (!isOpen) return null;

    const handleSelectContent = (item: SearchResult) => {
        addToHistory(item);
        onNavigate(item.type, item.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                <Search className="text-slate-500" size={20} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher une équipe, une ligue..."
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-lg font-medium"
                />
                {query ? (
                    <button onClick={() => setQuery('')} className="p-2 text-slate-500 active:text-white">
                        <X size={20} />
                    </button>
                ) : (
                    <button onClick={onClose} className="p-2 text-slate-400 font-bold text-sm">
                        Annuler
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">

                {/* STATE 1: RECENT HISTORY (Empty Query) */}
                {!query && history.length > 0 && (
                    <div className="mb-6 animate-slide-up">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Récent</h3>
                            <button onClick={clearHistory} className="text-xs text-slate-600 hover:text-red-500 font-medium transition-colors">
                                Effacer
                            </button>
                        </div>
                        <div className="space-y-4">
                            {history.map(item => (
                                <div key={item.id} onClick={() => handleSelectContent(item)} className="flex items-center gap-3 active:opacity-70 cursor-pointer">
                                    <Clock size={16} className="text-slate-600" />
                                    <span className="text-slate-300 flex-1">{item.name}</span>
                                    <span className="text-2xl mr-2">{item.logo}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STATE 2: EMPTY HISTORY */}
                {!query && history.length === 0 && (
                    <div className="text-center mt-20 text-slate-600">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm">Recherchez vos équipes et compétitions favorites</p>
                    </div>
                )}

                {/* STATE 3: RESULTS (With Query) */}
                {query && (
                    <div className="space-y-2 animate-slide-up">
                        {results.length > 0 ? (
                            results.map(item => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleSelectContent(item)}
                                    className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <span className="text-3xl">{item.logo}</span>
                                    <div className="flex-1">
                                        <div className="text-white font-bold">{item.name}</div>
                                        <div className="text-xs text-slate-500 uppercase">{item.type === 'TEAM' ? 'Équipe' : 'Compétition'} • {item.description}</div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-600" />
                                </div>
                            ))
                        ) : (
                            // EMPTY STATE
                            query.length > 2 && (
                                <div className="text-center mt-10 text-slate-500">
                                    <p>Aucun résultat pour "{query}"</p>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

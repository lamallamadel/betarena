import { useState, useEffect, useMemo } from 'react';
import { MOCK_MATCHES, MOCK_LEAGUES } from '../data/mockData';

export interface SearchResult {
    id: string;
    type: 'TEAM' | 'LEAGUE';
    name: string;
    description?: string; // Country for team
    logo: string;
}

interface UseSearchReturn {
    query: string;
    setQuery: (q: string) => void;
    results: SearchResult[];
    history: SearchResult[];
    addToHistory: (item: SearchResult) => void;
    clearHistory: () => void;
    isSearching: boolean;
}

const HISTORY_KEY = 'betarena_search_history';

/**
 * Hook de recherche globale
 * Extrait les données depuis les Mock Data existants
 * Gère le debounce et l'historique
 */
export const useSearch = (): UseSearchReturn => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [history, setHistory] = useState<SearchResult[]>(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Debounce Logic (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Save History
    useEffect(() => {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    // Derived Data Source (Aggregated from Matches & Leagues)
    const dataSource = useMemo(() => {
        const teamsMap = new Map<string, SearchResult>();
        const leaguesMap = new Map<string, SearchResult>();

        // Extract Leagues
        Object.entries(MOCK_LEAGUES).forEach(([name, data]: [string, any]) => {
            if (!leaguesMap.has(name)) {
                leaguesMap.set(name, {
                    id: name,
                    type: 'LEAGUE',
                    name: name,
                    logo: data.logo,
                    description: data.country
                });
            }
        });

        // Extract Teams from Matches
        MOCK_MATCHES.forEach((match) => {
            // Home Team
            if (!teamsMap.has(match.home)) {
                teamsMap.set(match.home, {
                    id: match.home,
                    type: 'TEAM',
                    name: match.home,
                    logo: match.homeLogo,
                    description: match.competition
                });
            }
            // Away Team
            if (!teamsMap.has(match.away)) {
                teamsMap.set(match.away, {
                    id: match.away,
                    type: 'TEAM',
                    name: match.away,
                    logo: match.awayLogo,
                    description: match.competition
                });
            }
        });

        return [...teamsMap.values(), ...leaguesMap.values()];
    }, []);

    // Perform Search
    const results = useMemo(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) return [];

        const normalizedQuery = debouncedQuery.toLowerCase().trim();

        return dataSource.filter(item =>
            item.name.toLowerCase().includes(normalizedQuery)
        ).slice(0, 10); // Limit to 10 results
    }, [debouncedQuery, dataSource]);

    // Actions
    const addToHistory = (item: SearchResult) => {
        setHistory(prev => {
            const filtered = prev.filter(i => i.id !== item.id);
            return [item, ...filtered].slice(0, 5); // Max 5 items
        });
    };

    const clearHistory = () => setHistory([]);

    return {
        query,
        setQuery,
        results,
        history,
        addToHistory,
        clearHistory,
        isSearching: query.length > 0
    };
};

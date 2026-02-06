import React, { useState } from 'react';
import {
    Search, Filter, MoreVertical, AlertTriangle, Lock,
    CheckCircle, Clock, Edit3, Eye
} from 'lucide-react';

// Mock match data
const MOCK_ADMIN_MATCHES = [
    {
        id: 'm1',
        homeTeam: 'Paris SG',
        awayTeam: 'Olympique Marseille',
        score: { home: 2, away: 1 },
        status: 'FINISHED',
        source: 'API',
        isLocked: false,
        betsCount: 342,
        date: '06/02/2026 20:45'
    },
    {
        id: 'm2',
        homeTeam: 'Real Madrid',
        awayTeam: 'FC Barcelona',
        score: { home: null, away: null },
        status: 'LIVE',
        source: 'API',
        isLocked: false,
        betsCount: 287,
        date: '06/02/2026 21:00'
    },
    {
        id: 'm3',
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester United',
        score: { home: 1, away: 0 },
        status: 'FINISHED',
        source: 'MANUAL',
        isLocked: true,
        betsCount: 198,
        date: '05/02/2026 18:30'
    },
    {
        id: 'm4',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        score: { home: null, away: null },
        status: 'SCHEDULED',
        source: 'API',
        isLocked: false,
        betsCount: 156,
        date: '07/02/2026 20:30'
    },
];

interface AdminMatch {
    id: string;
    homeTeam: string;
    awayTeam: string;
    score: { home: number | null; away: number | null };
    status: string;
    source: 'API' | 'MANUAL';
    isLocked: boolean;
    betsCount: number;
    date: string;
}

interface AdminMatchListProps {
    onOverrideClick: (matchId: string) => void;
    matches?: AdminMatch[];
    loading?: boolean;
}

export const AdminMatchList: React.FC<AdminMatchListProps> = ({ onOverrideClick, matches: propsMatches, loading = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Use provided matches or fallback to mock data
    const matchData = propsMatches && propsMatches.length > 0 ? propsMatches : MOCK_ADMIN_MATCHES;

    const filteredMatches = matchData.filter(match => {
        const matchesSearch = `${match.homeTeam} ${match.awayTeam}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'LIVE':
                return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE</span>;
            case 'FINISHED':
                return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1"><CheckCircle size={12} />TERMINÉ</span>;
            case 'SCHEDULED':
                return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 flex items-center gap-1"><Clock size={12} />PROGRAMMÉ</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4 animate-slide-up">
            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher un match..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-indigo-500 outline-none text-white placeholder-slate-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'LIVE', 'FINISHED', 'SCHEDULED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${statusFilter === status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                        >
                            {status === 'all' ? 'Tous' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Match Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Match</th>
                            <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase">Score</th>
                            <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase">Source</th>
                            <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase">Paris</th>
                            <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMatches.map(match => (
                            <tr key={match.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {match.isLocked && (
                                            <Lock size={14} className="text-amber-500" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-white">{match.homeTeam} vs {match.awayTeam}</p>
                                            <p className="text-xs text-slate-500">{match.date}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    {match.score.home !== null ? (
                                        <span className="font-bold text-lg text-white">
                                            {match.score.home} - {match.score.away}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">
                                        {getStatusBadge(match.status)}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${match.source === 'API'
                                        ? 'bg-slate-700 text-slate-300'
                                        : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {match.source}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="font-semibold text-slate-300">{match.betsCount}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                                            title="Voir détails"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => onOverrideClick(match.id)}
                                            className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors text-amber-400"
                                            title="Forcer le résultat"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

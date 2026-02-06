import React, { useState } from 'react';
import { FormIndicator } from './FormIndicator';

// Types
interface StandingEntry {
    rank: number;
    team: {
        id: string;
        name: string;
        shortName: string;
        logo: string;
    };
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalsDiff: number;
    points: number;
    form: ('W' | 'D' | 'L')[];
    zone: 'CHAMPIONS_LEAGUE' | 'EUROPA' | 'CONFERENCE' | 'RELEGATION' | 'NONE';
}

// Mock data Ligue 1
const MOCK_STANDINGS: StandingEntry[] = [
    { rank: 1, team: { id: 't1', name: 'Paris Saint-Germain', shortName: 'PSG', logo: '🔵' }, played: 20, won: 16, drawn: 2, lost: 2, goalsFor: 52, goalsAgainst: 18, goalsDiff: 34, points: 50, form: ['W', 'W', 'W', 'D', 'W'], zone: 'CHAMPIONS_LEAGUE' },
    { rank: 2, team: { id: 't2', name: 'AS Monaco', shortName: 'Monaco', logo: '🔴' }, played: 20, won: 13, drawn: 4, lost: 3, goalsFor: 42, goalsAgainst: 22, goalsDiff: 20, points: 43, form: ['W', 'D', 'W', 'W', 'L'], zone: 'CHAMPIONS_LEAGUE' },
    { rank: 3, team: { id: 't3', name: 'Olympique Marseille', shortName: 'OM', logo: '⚪' }, played: 20, won: 12, drawn: 5, lost: 3, goalsFor: 38, goalsAgainst: 20, goalsDiff: 18, points: 41, form: ['W', 'W', 'D', 'D', 'W'], zone: 'CHAMPIONS_LEAGUE' },
    { rank: 4, team: { id: 't4', name: 'LOSC Lille', shortName: 'Lille', logo: '🔴' }, played: 20, won: 11, drawn: 5, lost: 4, goalsFor: 35, goalsAgainst: 22, goalsDiff: 13, points: 38, form: ['D', 'W', 'W', 'L', 'W'], zone: 'EUROPA' },
    { rank: 5, team: { id: 't5', name: 'OGC Nice', shortName: 'Nice', logo: '🔴' }, played: 20, won: 10, drawn: 6, lost: 4, goalsFor: 30, goalsAgainst: 18, goalsDiff: 12, points: 36, form: ['W', 'D', 'D', 'W', 'D'], zone: 'EUROPA' },
    { rank: 6, team: { id: 't6', name: 'Olympique Lyon', shortName: 'Lyon', logo: '🔵' }, played: 20, won: 9, drawn: 7, lost: 4, goalsFor: 32, goalsAgainst: 24, goalsDiff: 8, points: 34, form: ['D', 'D', 'W', 'W', 'D'], zone: 'CONFERENCE' },
    { rank: 7, team: { id: 't7', name: 'RC Lens', shortName: 'Lens', logo: '🟡' }, played: 20, won: 9, drawn: 5, lost: 6, goalsFor: 28, goalsAgainst: 22, goalsDiff: 6, points: 32, form: ['L', 'W', 'W', 'D', 'L'], zone: 'NONE' },
    { rank: 8, team: { id: 't8', name: 'Stade Rennais', shortName: 'Rennes', logo: '🔴' }, played: 20, won: 8, drawn: 6, lost: 6, goalsFor: 26, goalsAgainst: 24, goalsDiff: 2, points: 30, form: ['D', 'L', 'W', 'D', 'W'], zone: 'NONE' },
    { rank: 9, team: { id: 't9', name: 'Stade Brestois', shortName: 'Brest', logo: '🔴' }, played: 20, won: 7, drawn: 8, lost: 5, goalsFor: 24, goalsAgainst: 22, goalsDiff: 2, points: 29, form: ['D', 'D', 'D', 'W', 'D'], zone: 'NONE' },
    { rank: 10, team: { id: 't10', name: 'RC Strasbourg', shortName: 'Strasbourg', logo: '🔵' }, played: 20, won: 7, drawn: 6, lost: 7, goalsFor: 25, goalsAgainst: 26, goalsDiff: -1, points: 27, form: ['L', 'W', 'D', 'L', 'W'], zone: 'NONE' },
    { rank: 15, team: { id: 't15', name: 'FC Nantes', shortName: 'Nantes', logo: '🟡' }, played: 20, won: 5, drawn: 5, lost: 10, goalsFor: 18, goalsAgainst: 30, goalsDiff: -12, points: 20, form: ['L', 'L', 'D', 'L', 'W'], zone: 'NONE' },
    { rank: 16, team: { id: 't16', name: 'Toulouse FC', shortName: 'Toulouse', logo: '🟣' }, played: 20, won: 4, drawn: 7, lost: 9, goalsFor: 20, goalsAgainst: 32, goalsDiff: -12, points: 19, form: ['D', 'L', 'D', 'L', 'D'], zone: 'RELEGATION' },
    { rank: 17, team: { id: 't17', name: 'Clermont Foot', shortName: 'Clermont', logo: '🔴' }, played: 20, won: 4, drawn: 5, lost: 11, goalsFor: 16, goalsAgainst: 35, goalsDiff: -19, points: 17, form: ['L', 'L', 'L', 'D', 'L'], zone: 'RELEGATION' },
    { rank: 18, team: { id: 't18', name: 'FC Metz', shortName: 'Metz', logo: '🟤' }, played: 20, won: 3, drawn: 5, lost: 12, goalsFor: 14, goalsAgainst: 38, goalsDiff: -24, points: 14, form: ['L', 'L', 'L', 'L', 'L'], zone: 'RELEGATION' },
];

interface StandingsTableProps {
    competitionName?: string;
    standings?: StandingEntry[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
    competitionName = 'Ligue 1',
    standings = MOCK_STANDINGS
}) => {
    const [activeTab, setActiveTab] = useState<'TOTAL' | 'HOME' | 'AWAY'>('TOTAL');

    const getZoneColor = (zone: StandingEntry['zone']) => {
        switch (zone) {
            case 'CHAMPIONS_LEAGUE': return 'bg-blue-600';
            case 'EUROPA': return 'bg-orange-500';
            case 'CONFERENCE': return 'bg-green-600';
            case 'RELEGATION': return 'bg-red-600';
            default: return 'bg-slate-700';
        }
    };

    const tabs = [
        { id: 'TOTAL' as const, label: 'Général' },
        { id: 'HOME' as const, label: 'Domicile' },
        { id: 'AWAY' as const, label: 'Extérieur' },
    ];

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-3">
                    {competitionName}
                </h2>
                {/* Tabs */}
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                    <thead>
                        <tr className="bg-slate-800/50">
                            <th className="py-3 px-2 text-left text-[10px] font-bold text-slate-500 uppercase w-10">#</th>
                            <th className="py-3 px-2 text-left text-[10px] font-bold text-slate-500 uppercase">Équipe</th>
                            <th className="py-3 px-2 text-center text-[10px] font-bold text-slate-500 uppercase w-10">MJ</th>
                            <th className="py-3 px-2 text-center text-[10px] font-bold text-slate-500 uppercase w-12">+/-</th>
                            <th className="py-3 px-2 text-center text-[10px] font-bold text-slate-500 uppercase w-12">Pts</th>
                            <th className="py-3 px-2 text-center text-[10px] font-bold text-slate-500 uppercase w-24">Forme</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((entry) => (
                            <tr
                                key={entry.team.id}
                                className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                            >
                                {/* Rank */}
                                <td className="py-3 px-2">
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold text-white ${getZoneColor(entry.zone)}`}>
                                        {entry.rank}
                                    </span>
                                </td>
                                {/* Team */}
                                <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{entry.team.logo}</span>
                                        <span className="text-sm font-semibold text-white">{entry.team.shortName}</span>
                                    </div>
                                </td>
                                {/* Played */}
                                <td className="py-3 px-2 text-center text-sm text-slate-400">{entry.played}</td>
                                {/* Goal Diff */}
                                <td className="py-3 px-2 text-center">
                                    <span className={`text-sm font-semibold ${entry.goalsDiff > 0 ? 'text-emerald-400' :
                                            entry.goalsDiff < 0 ? 'text-red-400' : 'text-slate-400'
                                        }`}>
                                        {entry.goalsDiff > 0 ? '+' : ''}{entry.goalsDiff}
                                    </span>
                                </td>
                                {/* Points */}
                                <td className="py-3 px-2 text-center text-sm font-black text-white">{entry.points}</td>
                                {/* Form */}
                                <td className="py-3 px-2">
                                    <div className="flex justify-center">
                                        <FormIndicator results={entry.form} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="p-3 border-t border-slate-800 flex flex-wrap gap-4 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-600" />
                    <span>LDC</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-orange-500" />
                    <span>Europa</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-600" />
                    <span>Conférence</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-600" />
                    <span>Relégation</span>
                </div>
            </div>
        </div>
    );
};

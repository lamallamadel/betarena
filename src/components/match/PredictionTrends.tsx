import React from 'react';
import { MOCK_PREDICTION_STATS } from '../../data/mockData';

interface PredictionTrendsProps {
    matchId: number | string;
}

export const PredictionTrends: React.FC<PredictionTrendsProps> = ({ matchId }) => {
    const stats = MOCK_PREDICTION_STATS[matchId] || { total: 0, home: 33, draw: 34, away: 33 };

    return (
        <div className="mb-6 bg-slate-900 border border-slate-800 p-4 rounded-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    📊 Tendance Globale
                </h4>
                <span className="text-[9px] font-bold text-slate-600">
                    {stats.total.toLocaleString()} paris
                </span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden border border-slate-800 mb-3">
                <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${stats.home}%` }}
                />
                <div
                    className="bg-slate-700 transition-all duration-500"
                    style={{ width: `${stats.draw}%` }}
                />
                <div
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${stats.away}%` }}
                />
            </div>
            <div className="flex justify-between text-[9px] font-black">
                <span className="text-emerald-500">🏠 {stats.home}%</span>
                <span className="text-slate-500">🤝 {stats.draw}%</span>
                <span className="text-red-500">✈️ {stats.away}%</span>
            </div>
        </div>
    );
};

import React from 'react';

interface ProgressBarProps {
    value: number;
    color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = "bg-emerald-500" }) => (
    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]`} style={{ width: `${value}%` }} />
    </div>
);

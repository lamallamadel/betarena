import React from 'react';

interface FormIndicatorProps {
    results: ('W' | 'D' | 'L')[];
}

/**
 * Affiche 5 pastilles de forme (Victoire/Nul/Défaite)
 * Ordre LTR: Récent à gauche -> Ancien à droite
 */
export const FormIndicator: React.FC<FormIndicatorProps> = ({ results }) => {
    const getColor = (result: 'W' | 'D' | 'L') => {
        switch (result) {
            case 'W': return 'bg-emerald-500';
            case 'D': return 'bg-slate-500';
            case 'L': return 'bg-red-500';
        }
    };

    return (
        <div className="flex gap-1">
            {results.slice(0, 5).map((result, i) => (
                <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${getColor(result)}`}
                    title={result === 'W' ? 'Victoire' : result === 'D' ? 'Nul' : 'Défaite'}
                />
            ))}
        </div>
    );
};

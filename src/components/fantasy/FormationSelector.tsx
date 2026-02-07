import React from 'react';
import type { Formation } from '../../types/types';

const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '3-4-3', '4-5-1'];

interface FormationSelectorProps {
  value: Formation;
  onChange: (f: Formation) => void;
  disabled?: boolean;
}

export const FormationSelector: React.FC<FormationSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Formation)}
      disabled={disabled}
      className="bg-slate-800 text-white text-sm font-bold rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
    >
      {FORMATIONS.map((f) => (
        <option key={f} value={f}>{f}</option>
      ))}
    </select>
  );
};

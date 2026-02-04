import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface AvatarDisplayProps {
    size?: string;
    avatar: React.ReactNode;
    frame: string;
    level: number;
    showShop?: boolean;
    onShopClick?: () => void;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ size = "w-10 h-10", avatar, frame, level, showShop = false, onShopClick }) => (
    <div className="relative">
        <div className={`${size} rounded-full bg-slate-800 flex items-center justify-center text-xl border-4 ${frame} transition-all duration-500 shadow-lg overflow-hidden`}>
            {avatar}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black text-[8px] font-black px-1 rounded border border-slate-900">
            {level}
        </div>
        {showShop && (
            <button
                onClick={onShopClick}
                className="absolute top-0 -right-2 bg-yellow-500 text-black p-1.5 rounded-full border-2 border-slate-950 shadow-lg active:scale-90 transition-transform"
            >
                <ShoppingBag size={10} />
            </button>
        )}
    </div>
);

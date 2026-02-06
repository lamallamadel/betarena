import React, { useState } from 'react';
import {
    LayoutDashboard, Trophy, Users, Bell, Shield, ChevronRight,
    LogOut, Settings, Menu, X
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
    currentView: string;
    onNavigate: (view: string) => void;
    adminUser: {
        name: string;
        role: 'SUPER_ADMIN' | 'MODERATOR';
        avatar?: string;
    };
    onLogout: () => void;
}

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MODERATOR'] },
    { id: 'matches', label: 'Matchs', icon: Trophy, roles: ['SUPER_ADMIN', 'MODERATOR'] },
    { id: 'users', label: 'Utilisateurs', icon: Users, roles: ['SUPER_ADMIN', 'MODERATOR'] },
    { id: 'marketing', label: 'Marketing', icon: Bell, roles: ['SUPER_ADMIN'] },
    { id: 'security', label: 'Sécurité', icon: Shield, roles: ['SUPER_ADMIN'] },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    currentView,
    onNavigate,
    adminUser,
    onLogout
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const filteredNav = NAV_ITEMS.filter(item =>
        item.roles.includes(adminUser.role)
    );

    return (
        <div className="flex h-screen bg-slate-950 text-white">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300`}>
                {/* Logo */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🎯</span>
                            <span className="font-black text-lg tracking-tight">BETARENA</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {filteredNav.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${currentView === item.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && (
                                <>
                                    <span className="font-semibold text-sm flex-1 text-left">{item.label}</span>
                                    {currentView === item.id && <ChevronRight size={16} />}
                                </>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Info */}
                <div className="p-3 border-t border-slate-800">
                    <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 ${!sidebarOpen && 'justify-center'}`}>
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
                            {adminUser.name[0].toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{adminUser.name}</p>
                                <p className="text-xs text-slate-500 uppercase">{adminUser.role.replace('_', ' ')}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onLogout}
                        className={`w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${!sidebarOpen && 'justify-center'}`}
                    >
                        <LogOut size={18} />
                        {sidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
                    <h1 className="text-xl font-black uppercase tracking-tight">
                        {NAV_ITEMS.find(i => i.id === currentView)?.label || 'Admin'}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${adminUser.role === 'SUPER_ADMIN'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            {adminUser.role.replace('_', ' ')}
                        </span>
                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <Settings size={18} className="text-slate-400" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

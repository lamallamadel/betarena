import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminMatchList } from './AdminMatchList';
import { MatchOverrideModal } from './MatchOverrideModal';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../context/AuthContext';

export const AdminApp: React.FC = () => {
    const { user: authUser, profile } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const [selectedMatchInfo, setSelectedMatchInfo] = useState<any>(null);

    // Mock admin user (in production, verify from Firestore admin_users collection)
    const adminUser = authUser ? {
        uid: authUser.uid,
        name: profile?.pseudo || 'Admin',
        role: 'SUPER_ADMIN' as const
    } : null;

    const {
        matches,
        logs,
        loading,
        error,
        overrideMatch,
        refreshMatches
    } = useAdmin(adminUser);

    const handleOverrideClick = (matchId: string) => {
        // Find match info for the modal
        const match = matches.find(m => m.id === matchId);
        setSelectedMatchInfo(match ? {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            currentScore: match.score
        } : null);
        setSelectedMatchId(matchId);
        setOverrideModalOpen(true);
    };

    const handleOverrideConfirm = async (data: any) => {
        const success = await overrideMatch(data);
        if (success) {
            setOverrideModalOpen(false);
            alert('✅ Score forcé avec succès ! Les paris seront recalculés.');
        } else {
            alert('❌ Erreur lors de la modification du score.');
        }
    };

    const handleLogout = () => {
        window.location.href = '/'; // Return to main app
    };

    if (!authUser) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 mb-4">Vous devez être connecté pour accéder à l'admin.</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500"
                    >
                        Retour à l'app
                    </button>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'matches':
                return (
                    <AdminMatchList
                        onOverrideClick={handleOverrideClick}
                        matches={matches}
                        loading={loading}
                    />
                );
            case 'users':
                return (
                    <div className="flex items-center justify-center h-64 bg-slate-900 rounded-2xl border border-slate-800">
                        <p className="text-slate-500 font-medium">Module Utilisateurs - À venir</p>
                    </div>
                );
            case 'marketing':
                return (
                    <div className="flex items-center justify-center h-64 bg-slate-900 rounded-2xl border border-slate-800">
                        <p className="text-slate-500 font-medium">Module Marketing - À venir</p>
                    </div>
                );
            case 'security':
                return (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                        <h3 className="font-bold text-white mb-4">Logs Admin Récents</h3>
                        <div className="space-y-2">
                            {logs.length === 0 ? (
                                <p className="text-slate-500 text-sm">Aucun log disponible</p>
                            ) : (
                                logs.slice(0, 10).map((log, i) => (
                                    <div key={log.id || i} className="p-3 bg-slate-800/50 rounded-lg text-sm">
                                        <span className="font-bold text-indigo-400">{log.adminName}</span>
                                        <span className="text-slate-400"> a effectué </span>
                                        <span className="font-mono text-amber-400">{log.action}</span>
                                        <span className="text-slate-400"> sur </span>
                                        <span className="text-slate-300">{log.targetId}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            default:
                return <AdminDashboard />;
        }
    };

    return (
        <>
            <AdminLayout
                currentView={currentView}
                onNavigate={setCurrentView}
                adminUser={adminUser!}
                onLogout={handleLogout}
            >
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                        {error}
                    </div>
                )}
                {renderContent()}
            </AdminLayout>

            <MatchOverrideModal
                isOpen={overrideModalOpen}
                onClose={() => setOverrideModalOpen(false)}
                matchId={selectedMatchId || ''}
                matchInfo={selectedMatchInfo}
                onConfirm={handleOverrideConfirm}
            />
        </>
    );
};


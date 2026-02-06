import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminMatchList } from './AdminMatchList';
import { MatchOverrideModal } from './MatchOverrideModal';

// Mock admin user (would come from auth context in production)
const MOCK_ADMIN = {
    name: 'Admin Test',
    role: 'SUPER_ADMIN' as const,
};

export const AdminApp: React.FC = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

    const handleOverrideClick = (matchId: string) => {
        setSelectedMatchId(matchId);
        setOverrideModalOpen(true);
    };

    const handleOverrideConfirm = (data: any) => {
        console.log('[Admin] Override confirmed:', data);
        // In production: Call Firestore function to process override
        alert(`Score forcé: ${data.newScore.home} - ${data.newScore.away}\nStratégie: ${data.strategy}`);
    };

    const handleLogout = () => {
        // In production: Sign out and redirect
        console.log('[Admin] Logout');
    };

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'matches':
                return <AdminMatchList onOverrideClick={handleOverrideClick} />;
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
                    <div className="flex items-center justify-center h-64 bg-slate-900 rounded-2xl border border-slate-800">
                        <p className="text-slate-500 font-medium">Module Sécurité - À venir</p>
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
                adminUser={MOCK_ADMIN}
                onLogout={handleLogout}
            >
                {renderContent()}
            </AdminLayout>

            <MatchOverrideModal
                isOpen={overrideModalOpen}
                onClose={() => setOverrideModalOpen(false)}
                matchId={selectedMatchId || ''}
                matchInfo={{
                    homeTeam: 'Paris SG',
                    awayTeam: 'Olympique Marseille',
                    currentScore: { home: 2, away: 1 }
                }}
                onConfirm={handleOverrideConfirm}
            />
        </>
    );
};

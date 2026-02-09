import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Zap } from 'lucide-react';
import { useBlitz } from '../../hooks/useBlitz';
import { BlitzTournamentCard } from './BlitzTournamentCard';
import { DraftScreen } from './DraftScreen';
import { BlitzLeaderboard } from './BlitzLeaderboard';
import { BlitzResultModal } from './BlitzResultModal';
import type { RichUserProfile, BlitzTournament } from '../../types/types';

interface BlitzViewProps {
  user: RichUserProfile;
  onNavigate: (view: string) => void;
}

export const BlitzView: React.FC<BlitzViewProps> = ({ user, onNavigate }) => {
  const { tournaments, myEntry, loading, joinTournament, submitLineup, fetchMyEntry } = useBlitz(user.uid);
  const [activeTournament, setActiveTournament] = useState<BlitzTournament | null>(null);
  const [showDraft, setShowDraft] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Auto-fetch entry when a tournament is selected
  useEffect(() => {
    if (!activeTournament) return;
    const unsub = fetchMyEntry(activeTournament.id);
    return () => unsub();
  }, [activeTournament?.id, fetchMyEntry]);

  // Show draft screen if entry exists and has no lineup
  useEffect(() => {
    if (myEntry && myEntry.draft_pool.length > 0 && myEntry.selected_lineup.length === 0) {
      const timer = setTimeout(() => setShowDraft(true), 0);
      return () => clearTimeout(timer);
    }
  }, [myEntry]);

  const handleJoin = async (tournamentId: string) => {
    const tourn = tournaments.find((t) => t.id === tournamentId);
    await joinTournament(tournamentId);
    if (tourn) setActiveTournament(tourn);
  };

  const handleSubmitLineup = async (selectedIds: string[]) => {
    if (!activeTournament) return;
    await submitLineup(activeTournament.id, selectedIds);
    setShowDraft(false);
  };

  if (loading) {
    return <div className="h-full bg-slate-950 flex items-center justify-center text-slate-400">Chargement...</div>;
  }

  // Draft screen overlay
  if (showDraft && myEntry && activeTournament) {
    return (
      <DraftScreen
        entry={myEntry}
        onSubmit={handleSubmitLineup}
        onClose={() => setShowDraft(false)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate('HOME')} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" />
          Blitz 5
        </h1>
        <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
          <Coins size={16} />{user.coins}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Active entry */}
        {myEntry && activeTournament && myEntry.selected_lineup.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-emerald-400 uppercase mb-2">Mon Blitz en cours</p>
            <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-3 mb-2">
              <p className="text-sm font-bold text-white">{activeTournament.name}</p>
              <p className="text-xs text-slate-400 mt-1">{myEntry.selected_lineup.length} joueurs sélectionnés</p>
              {myEntry.total_score > 0 && (
                <p className="text-xs text-emerald-400 font-bold mt-1">Score : {myEntry.total_score} pts</p>
              )}
              {myEntry.rank > 0 && (
                <button onClick={() => setShowResult(true)} className="text-xs text-yellow-400 underline mt-1">
                  Voir résultat
                </button>
              )}
            </div>
            <BlitzLeaderboard tournament={activeTournament} userId={user.uid} />
          </div>
        )}

        {/* Tournament list */}
        <p className="text-xs font-bold text-slate-500 uppercase mb-3">Tournois disponibles</p>
        {tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Zap size={40} className="mb-3 opacity-50" />
            <p className="text-sm">Aucun tournoi disponible</p>
          </div>
        ) : (
          tournaments.map((t) => (
            <BlitzTournamentCard
              key={t.id}
              tournament={t}
              onJoin={handleJoin}
              hasEntry={myEntry?.tournament_id === t.id}
            />
          ))
        )}
      </div>

      {/* Result modal */}
      {showResult && myEntry && activeTournament && (
        <BlitzResultModal
          entry={myEntry}
          tournament={activeTournament}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  );
};

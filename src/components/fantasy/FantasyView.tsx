import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Coins, Clock, Save } from 'lucide-react';
import { useFantasyTeam } from '../../hooks/useFantasyTeam';
import { useMarketplace } from '../../hooks/useMarketplace';
import { FormationSelector } from './FormationSelector';
import { TeamEditor } from './TeamEditor';
import { PlayerPicker } from './PlayerPicker';
import { GameweekResults } from './GameweekResults';
import type { RichUserProfile, Formation, LineupPlayer, PlayerPosition } from '../../types/types';
import { VALID_FORMATIONS } from '../../types/types';

interface FantasyViewProps {
  user: RichUserProfile;
  onNavigate: (view: string) => void;
}

export const FantasyView: React.FC<FantasyViewProps> = ({ user, onNavigate }) => {
  const { currentGameweek, myLineup, lineupPlayers, loading, saveLineup } = useFantasyTeam(user.uid);
  const { myCards } = useMarketplace(user.uid);
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [localPlayers, setLocalPlayers] = useState<(LineupPlayer | null)[]>([]);
  const [captainId, setCaptainId] = useState<string | undefined>();
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Sync from server
  useEffect(() => {
    if (myLineup) {
      setFormation(myLineup.formation);
      setCaptainId(myLineup.captain_id);
    }
    if (lineupPlayers.length > 0) {
      setLocalPlayers(lineupPlayers);
    }
  }, [myLineup, lineupPlayers]);

  // Deadline countdown
  useEffect(() => {
    if (!currentGameweek) return;
    const interval = setInterval(() => {
      const diff = currentGameweek.deadline_at - Date.now();
      if (diff <= 0) { setCountdown('Deadline passée'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentGameweek]);

  const getPositionForSlot = useCallback((slot: number): PlayerPosition => {
    if (slot >= 12) return 'DEF'; // bench — any position
    const f = VALID_FORMATIONS[formation];
    if (slot === 1) return 'GK';
    if (slot <= 1 + f.DEF) return 'DEF';
    if (slot <= 1 + f.DEF + f.MID) return 'MID';
    return 'FWD';
  }, [formation]);

  const handleSlotClick = (slot: number) => {
    setPickerSlot(slot);
  };

  const handleSelectPlayer = (cardId: string) => {
    if (pickerSlot === null) return;
    const card = myCards.find((c) => c.id === cardId);
    if (!card) return;
    const newPlayer: LineupPlayer = {
      card_id: cardId,
      card,
      position_slot: pickerSlot,
      is_subbed_in: false,
    };
    setLocalPlayers((prev) => [...prev.filter((p) => p?.position_slot !== pickerSlot), newPlayer]);
    setPickerSlot(null);
  };

  const handleRemovePlayer = (slot: number) => {
    setLocalPlayers((prev) => prev.filter((p) => p?.position_slot !== slot));
  };

  const handleSave = async () => {
    if (!currentGameweek) return;
    setSaving(true);
    try {
      await saveLineup(currentGameweek.id, formation, localPlayers.filter(Boolean) as LineupPlayer[], captainId);
    } finally {
      setSaving(false);
    }
  };

  const alreadySelected = localPlayers.filter(Boolean).map((p) => p!.card_id);
  const isLocked = myLineup?.status === 'LOCKED' || currentGameweek?.status !== 'OPEN';
  const starterCount = localPlayers.filter((p) => p && p.position_slot <= 11).length;

  if (loading) {
    return <div className="h-full bg-slate-950 flex items-center justify-center text-slate-400">Chargement...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate('HOME')} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-white">Mon Équipe</h1>
        <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
          <Coins size={16} />{user.coins}
        </div>
      </div>

      {/* Gameweek info */}
      {currentGameweek ? (
        <div className="shrink-0 bg-slate-800/40 px-4 py-2 flex items-center justify-between border-b border-slate-800/50">
          <span className="text-xs font-bold text-white">GW {currentGameweek.number}</span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={12} />
            <span>{countdown}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            currentGameweek.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-400' :
            currentGameweek.status === 'LIVE' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>{currentGameweek.status}</span>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Aucune journée en cours
        </div>
      )}

      {/* Content */}
      {currentGameweek && (
        <div className="flex-1 overflow-y-auto p-4">
          {currentGameweek.status === 'FINISHED' && myLineup ? (
            <GameweekResults lineup={myLineup} players={lineupPlayers} formation={formation} />
          ) : (
            <>
              {/* Formation selector */}
              <div className="flex items-center justify-between mb-4">
                <FormationSelector value={formation} onChange={setFormation} disabled={isLocked} />
                <span className="text-xs text-slate-500">{starterCount}/11 titulaires</span>
              </div>

              {/* Team editor */}
              <TeamEditor
                formation={formation}
                players={localPlayers}
                onSlotClick={handleSlotClick}
                onRemovePlayer={handleRemovePlayer}
                captainId={captainId}
                onSetCaptain={setCaptainId}
                disabled={isLocked}
              />

              {/* Save button */}
              {!isLocked && (
                <button
                  onClick={handleSave}
                  disabled={starterCount < 11 || saving}
                  className="w-full mt-6 py-3 rounded-xl font-bold text-sm bg-emerald-500 text-black active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder l\'équipe'}
                </button>
              )}
              {isLocked && (
                <p className="text-center text-xs text-slate-500 mt-4">Équipe verrouillée pour cette journée</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Player picker modal */}
      {pickerSlot !== null && (
        <PlayerPicker
          slot={pickerSlot}
          position={getPositionForSlot(pickerSlot)}
          availableCards={myCards}
          onSelect={handleSelectPlayer}
          onClose={() => setPickerSlot(null)}
          alreadySelected={alreadySelected}
        />
      )}
    </div>
  );
};

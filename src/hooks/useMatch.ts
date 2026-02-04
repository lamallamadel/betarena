import { useState } from 'react';
import type {Match, MatchEventType, MatchStatus} from "../types/types.ts";

export const useMatch = () => {
  // État initial simulant une connexion Provider (Module C)
  const [match, setMatch] = useState<Match>({
    id: 'm-PSG-OM-2024',
    homeTeam: 'PSG',
    awayTeam: 'OM',
    homeScore: 0,
    awayScore: 0,
    status: 'PRE_MATCH', // RG-A01: Important pour le verrouillage initial
    minute: 0
  });

  const [matchEvents, setMatchEvents] = useState<any[]>([]);
  const [goalAnimation, setGoalAnimation] = useState<string | null>(null);

  // Simulation Provider / Admin (RG-G01: Logs auditables imaginés côté back)
  const addMatchEvent = (type: MatchEventType, team: 'HOME' | 'AWAY' | 'SYSTEM', playerName?: string) => {
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type, team, minute: match.minute, playerName,
    };

    setMatchEvents(prev => [newEvent, ...prev]);

    // RG-C02: Gestion VAR (Annulation) à prévoir ici plus tard
    if (type === 'GOAL') {
      if (team === 'HOME') setMatch(m => ({ ...m, homeScore: m.homeScore + 1 }));
      if (team === 'AWAY') setMatch(m => ({ ...m, awayScore: m.awayScore + 1 }));

      // Indicateur visuel fort (Module C.3)
      setGoalAnimation(team);
      setTimeout(() => setGoalAnimation(null), 3000);
    }
  };

  const setStatus = (status: MatchStatus) => setMatch(m => ({ ...m, status }));
  const advanceTime = (minutes: number = 1) => setMatch(m => ({ ...m, minute: m.minute + minutes }));

  return { match, matchEvents, addMatchEvent, advanceTime, setStatus, goalAnimation };
};
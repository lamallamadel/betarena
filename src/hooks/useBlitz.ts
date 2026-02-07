import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, runTransaction, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import type { BlitzTournament, BlitzEntry, DraftCard, PlayerReference } from '../types/types';

// Mock player pool for draft generation (RNG)
const MOCK_PLAYER_POOL: PlayerReference[] = [
  // GOLD tier
  { id: 'p1', name: 'Mbappé', club: 'PSG', position: 'FWD', base_value: 5000 },
  { id: 'p2', name: 'Haaland', club: 'Man City', position: 'FWD', base_value: 5000 },
  { id: 'p3', name: 'Bellingham', club: 'Real Madrid', position: 'MID', base_value: 4500 },
  { id: 'p4', name: 'De Bruyne', club: 'Man City', position: 'MID', base_value: 4500 },
  { id: 'p5', name: 'Donnarumma', club: 'PSG', position: 'GK', base_value: 3000 },
  { id: 'p6', name: 'Salah', club: 'Liverpool', position: 'FWD', base_value: 4800 },
  { id: 'p7', name: 'Vinícius Jr', club: 'Real Madrid', position: 'FWD', base_value: 4700 },
  // SILVER tier
  { id: 'p8', name: 'Hakimi', club: 'PSG', position: 'DEF', base_value: 3000 },
  { id: 'p9', name: 'Tchouaméni', club: 'Real Madrid', position: 'MID', base_value: 2800 },
  { id: 'p10', name: 'Gündoğan', club: 'Barcelone', position: 'MID', base_value: 2500 },
  { id: 'p11', name: 'Rüdiger', club: 'Real Madrid', position: 'DEF', base_value: 2500 },
  { id: 'p12', name: 'Maignan', club: 'AC Milan', position: 'GK', base_value: 2200 },
  { id: 'p13', name: 'Barella', club: 'Inter', position: 'MID', base_value: 2800 },
  { id: 'p14', name: 'Díaz', club: 'Liverpool', position: 'FWD', base_value: 2600 },
  // BRONZE tier
  { id: 'p15', name: 'Kolo Muani', club: 'PSG', position: 'FWD', base_value: 1500 },
  { id: 'p16', name: 'Nuno Mendes', club: 'PSG', position: 'DEF', base_value: 1400 },
  { id: 'p17', name: 'Camavinga', club: 'Real Madrid', position: 'MID', base_value: 1600 },
  { id: 'p18', name: 'Koundé', club: 'Barcelone', position: 'DEF', base_value: 1500 },
  { id: 'p19', name: 'Svilar', club: 'AS Roma', position: 'GK', base_value: 1000 },
  { id: 'p20', name: 'Xhaka', club: 'Leverkusen', position: 'MID', base_value: 1200 },
  { id: 'p21', name: 'Thuram', club: 'Inter', position: 'FWD', base_value: 1400 },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// RG-N02: Generate a balanced pool of 15 cards (5 Gold, 5 Silver, 5 Bronze)
// MUST guarantee positional coverage: min 2 GK, 2 DEF, 4 MID, 2 FWD
const generateDraftPool = (): DraftCard[] => {
  const gold = MOCK_PLAYER_POOL.filter((p) => p.base_value >= 4000);
  const silver = MOCK_PLAYER_POOL.filter((p) => p.base_value >= 2000 && p.base_value < 4000);
  const bronze = MOCK_PLAYER_POOL.filter((p) => p.base_value < 2000);

  const pickFromTier = (tier: PlayerReference[], n: number, tierName: DraftCardTier): DraftCard[] =>
    shuffle(tier).slice(0, n).map((p): DraftCard => ({ player_reference_id: p.id, player: p, tier: tierName }));

  // Build initial pool
  let pool: DraftCard[] = [
    ...pickFromTier(gold, 5, 'GOLD'),
    ...pickFromTier(silver, 5, 'SILVER'),
    ...pickFromTier(bronze, 5, 'BRONZE'),
  ];

  // RG-N02: Validate positional coverage (2 GK, 2 DEF, 4 MID, 2 FWD)
  const countPos = (pos: string) => pool.filter((c) => c.player.position === pos).length;
  const allPlayers = shuffle([...MOCK_PLAYER_POOL]);

  const ensureMinimum = (pos: PlayerPosition, min: number) => {
    while (countPos(pos) < min && pool.length <= 15) {
      const candidate = allPlayers.find(
        (p) => p.position === pos && !pool.some((c) => c.player_reference_id === p.id)
      );
      if (!candidate) break;
      // Replace a random player of the most over-represented position
      const overPos = (['GK', 'DEF', 'MID', 'FWD'] as PlayerPosition[])
        .filter((pp) => pp !== pos)
        .sort((a, b) => countPos(b) - countPos(a))[0];
      const replaceIdx = pool.findIndex((c) => c.player.position === overPos);
      if (replaceIdx >= 0) {
        const tier = pool[replaceIdx].tier;
        pool[replaceIdx] = { player_reference_id: candidate.id, player: candidate, tier };
      }
    }
  };

  ensureMinimum('GK', 2);
  ensureMinimum('DEF', 2);
  ensureMinimum('MID', 4);
  ensureMinimum('FWD', 2);

  return pool;
};

export const useBlitz = (userId: string | undefined) => {
  const [tournaments, setTournaments] = useState<BlitzTournament[]>([]);
  const [myEntry, setMyEntry] = useState<BlitzEntry | null>(null);
  const [leaderboard, setLeaderboard] = useState<BlitzEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch open/live tournaments
  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'blitz_tournaments'),
      where('status', 'in', ['OPEN', 'LIVE']),
      orderBy('start_time', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setTournaments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlitzTournament)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // Fetch user's current entry
  const fetchMyEntry = (tournamentId: string) => {
    if (!userId) return () => {};
    const ref = doc(db, 'artifacts', APP_ID, 'users', userId, 'blitz_entries', tournamentId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setMyEntry({ id: snap.id, ...snap.data() } as BlitzEntry);
      } else {
        setMyEntry(null);
      }
    });
    return unsub;
  };

  // Fetch leaderboard for a tournament
  const fetchLeaderboard = (tournamentId: string) => {
    const q = query(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'blitz_tournaments', tournamentId, 'leaderboard'),
      orderBy('total_score', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLeaderboard(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlitzEntry)));
    });
    return unsub;
  };

  // Join tournament (RG-N03: rake on entry fee)
  const joinTournament = async (tournamentId: string) => {
    if (!userId) throw new Error("Non connecté");

    const tournamentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'blitz_tournaments', tournamentId);
    const userRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'data', 'profile');
    const entryRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'blitz_entries', tournamentId);

    await runTransaction(db, async (t) => {
      const tournDoc = await t.get(tournamentRef);
      const userDoc = await t.get(userRef);

      if (!tournDoc.exists()) throw new Error("Tournoi introuvable");
      if (!userDoc.exists()) throw new Error("Profil introuvable");

      const tourn = tournDoc.data() as BlitzTournament;
      const userCoins = userDoc.data()?.coins || 0;

      if (tourn.status !== 'OPEN') throw new Error("Tournoi fermé");
      if (userCoins < tourn.entry_fee) throw new Error("Solde insuffisant");

      const rake = Math.floor(tourn.entry_fee * (tourn.rake_percent / 100));
      const toPot = tourn.entry_fee - rake;
      const draftPool = generateDraftPool();

      // Debit user
      t.update(userRef, { coins: userCoins - tourn.entry_fee });

      // Update tournament pool + participant count
      t.update(tournamentRef, {
        prize_pool: tourn.prize_pool + toPot,
        participant_count: tourn.participant_count + 1,
      });

      // Create entry
      t.set(entryRef, {
        tournament_id: tournamentId,
        user_id: userId,
        draft_pool: draftPool,
        selected_lineup: [],
        total_score: 0,
        rank: 0,
        win_amount: 0,
        created_at: Date.now(),
      });
    });
  };

  // Submit lineup (RG-N04: validate 1-1-2-1 formation)
  const submitLineup = async (tournamentId: string, selectedPlayerRefIds: string[]) => {
    if (!userId) throw new Error("Non connecté");
    if (selectedPlayerRefIds.length !== 5) throw new Error("Sélectionnez exactement 5 joueurs");

    const entryRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'blitz_entries', tournamentId);

    await runTransaction(db, async (t) => {
      const entryDoc = await t.get(entryRef);
      if (!entryDoc.exists()) throw new Error("Entrée introuvable");

      const entry = entryDoc.data() as BlitzEntry;
      const pool = entry.draft_pool;

      // Anti-cheat: verify all selected are in pool
      const selected = selectedPlayerRefIds.map((id) => {
        const card = pool.find((c) => c.player_reference_id === id);
        if (!card) throw new Error("Joueur invalide (anti-cheat)");
        return card;
      });

      // Validate formation 1-1-2-1 (RG-N04)
      const positions = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      selected.forEach((c) => { positions[c.player.position]++; });

      if (positions.GK !== 1) throw new Error("Il faut exactement 1 Gardien");
      if (positions.DEF !== 1) throw new Error("Il faut exactement 1 Défenseur");
      if (positions.MID !== 2) throw new Error("Il faut exactement 2 Milieux");
      if (positions.FWD !== 1) throw new Error("Il faut exactement 1 Attaquant");

      t.update(entryRef, {
        selected_lineup: selected,
        created_at: Date.now(),
      });
    });
  };

  return {
    tournaments,
    myEntry,
    leaderboard,
    loading,
    joinTournament,
    submitLineup,
    fetchMyEntry,
    fetchLeaderboard,
  };
};

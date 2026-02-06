# Plan d'implémentation — Modules L, M, N

## Vue d'ensemble

| Module | Nom | Dépendances | Complexité |
|---|---|---|---|
| **L** | Le Marché & La Bourse (Marketplace) | Aucune (nouveau système) | Haute |
| **M** | Gestion d'Équipe (Ultimate Fantazia) | Module L (cartes/inventaire) | Haute |
| **N** | Mode Imaginaire (Blitz 5) | Module M (moteur de scoring) | Moyenne |

**Ordre d'implémentation obligatoire : L → M → N** (chaîne de dépendances)

---

## Phase 1 — Module L : Le Marché & La Bourse

### 1.1 Types & Data Model

**Fichier :** `src/types/types.ts` — ajouter :

```typescript
// --- Module L : Marketplace ---
type CardScarcity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED';

interface PlayerReference {
  id: string;
  name: string;
  club: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  photo?: string;
  base_value: number;        // Prix conseillé système
}

interface Card {
  id: string;
  player_reference_id: string;
  player: PlayerReference;    // Dénormalisé pour l'affichage
  owner_id: string;
  scarcity: CardScarcity;
  serial_number: number;      // ex: 5 pour #5/100
  max_supply: number;         // ex: 100 pour RARE
  is_locked: boolean;         // En vente ou aligné en équipe
  instance_id: number;        // Segmentation marché (RG-L01)
}

interface MarketListing {
  id: string;
  card_id: string;
  card: Card;                 // Dénormalisé
  seller_id: string;
  seller_pseudo: string;
  price: number;
  net_seller: number;         // price * 0.9 (après taxe RG-L02)
  status: ListingStatus;
  created_at: string;
}

interface Pack {
  id: string;
  name: string;               // "Pack Attaquants Or"
  price: number;
  contents: { scarcity: CardScarcity; count: number }[];
  stock: number;              // Stock restant (RG-L03)
  instance_id: number;
}

interface PriceHistory {
  date: string;
  avg_price: number;
}
```

**Firestore paths :**

```
artifacts/{APP_ID}/public/data/player_references/{playerId}
artifacts/{APP_ID}/users/{uid}/cards/{cardId}
artifacts/{APP_ID}/public/data/market_listings/{listingId}
artifacts/{APP_ID}/public/data/packs/{packId}
artifacts/{APP_ID}/public/data/price_history/{playerRefId}/entries/{date}
```

### 1.2 Hook : `useMarketplace.ts`

**Fichier :** `src/hooks/useMarketplace.ts`

Fonctions principales :

| Fonction | Description | Transaction atomique ? |
|---|---|---|
| `fetchPacks()` | Liste les packs disponibles (Banque) | Non |
| `buyPack(packId)` | Achat primaire : débit coins, décrément stock, RNG cartes, ajout inventaire | **Oui** |
| `listCard(cardId, price)` | Mise en vente : vérifier pas locked, set `ON_SALE`, créer listing | **Oui** |
| `cancelListing(listingId)` | Annuler vente : remettre carte dans inventaire | **Oui** |
| `buyListing(listingId)` | Achat P2P : vérif solde, vérif listing actif, débit acheteur, taxe 10% (RG-L02), crédit vendeur, transfert propriété | **Oui** |
| `fetchListings(filters)` | Parcourir le marché secondaire avec filtres (poste, prix, rareté) | Non |
| `fetchPriceHistory(playerRefId)` | Historique des prix sur 30 jours (RG-L04) | Non |
| `fetchMyCards()` | Inventaire de l'utilisateur | Non (onSnapshot) |

**Points critiques :**
- `buyListing` doit gérer les race conditions (SELECT FOR UPDATE via transaction Firestore)
- La taxe de 10% est un "burn" (RG-L02) — les coins sont détruits, pas reversés
- Carte locked = inutilisable dans Module M (RG-L05)

### 1.3 Composants UI

| Composant | Fichier | Description |
|---|---|---|
| `MarketplaceView` | `src/components/marketplace/MarketplaceView.tsx` | Hub principal avec onglets Banque / Transferts |
| `BankTab` | `src/components/marketplace/BankTab.tsx` | Grille de packs + joueurs à la une |
| `TransfersTab` | `src/components/marketplace/TransfersTab.tsx` | Listings P2P avec filtres (poste, prix, rareté) |
| `CardDisplay` | `src/components/marketplace/CardDisplay.tsx` | Carte joueur réutilisable (photo, rareté badge, serial) |
| `SellModal` | `src/components/marketplace/SellModal.tsx` | Modal vente : input prix, calculateur taxe, net vendeur |
| `PriceChart` | `src/components/marketplace/PriceChart.tsx` | Courbe historique prix (Line Chart simple, 30 jours) |
| `PackOpenAnimation` | `src/components/marketplace/PackOpenAnimation.tsx` | Animation ouverture de pack (reveal des cartes) |
| `InventoryView` | `src/components/marketplace/InventoryView.tsx` | Grille des cartes possédées (filtre, tri, action vendre) |

**Design :**
- Badges rareté : Common = `bg-slate-500`, Rare = `bg-blue-500`, Epic = `bg-purple-500`, Legendary = `bg-yellow-500`
- Même pattern dark theme (`bg-slate-950`, `text-slate-200`)
- Mobile-first `max-w-md`

### 1.4 Intégration App.tsx

- Ajouter `MARKETPLACE` et `INVENTORY` au switch `currentView`
- Ajouter un bouton nav ou accès depuis le Shop existant
- Ajouter les types dans la nav bar

### 1.5 Tâches Module L

1. Définir les types dans `types.ts`
2. Créer `useMarketplace.ts` — commencer par `fetchMyCards` + `fetchPacks`
3. Créer `CardDisplay.tsx` (réutilisé partout)
4. Créer `MarketplaceView.tsx` + `BankTab.tsx` (achat primaire)
5. Implémenter `buyPack()` avec transaction atomique + RNG
6. Créer `TransfersTab.tsx` + `SellModal.tsx` (P2P)
7. Implémenter `listCard()`, `cancelListing()`, `buyListing()` avec transactions
8. Créer `PriceChart.tsx` (historique)
9. Créer `InventoryView.tsx`
10. Créer `PackOpenAnimation.tsx`
11. Intégrer dans `App.tsx` (routing + nav)

---

## Phase 2 — Module M : Gestion d'Équipe (Ultimate Fantazia)

### 2.1 Types & Data Model

**Fichier :** `src/types/types.ts` — ajouter :

```typescript
// --- Module M : Fantasy Team ---
type GameweekStatus = 'OPEN' | 'LIVE' | 'FINISHED';
type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '5-3-2' | '3-4-3' | '4-5-1';

interface Gameweek {
  id: string;
  number: number;
  deadline_at: string;        // ISO timestamp
  status: GameweekStatus;
}

interface Lineup {
  id: string;
  user_id: string;
  gameweek_id: string;
  formation: Formation;
  captain_id?: string;        // Card ID — points x2
  score_total: number;        // Calculé après matchs
  status: 'DRAFT' | 'SAVED' | 'LOCKED';
}

interface LineupPlayer {
  card_id: string;
  card: Card;                 // Dénormalisé
  position_slot: number;      // 1-11 (titulaire), 12-15 (banc)
  is_subbed_in: boolean;      // Remplacé par l'algo (RG-M03)
  points?: number;            // Points individuels post-calcul
}

// Barème de scoring (RG-M01)
interface ScoringRules {
  presence_60min: number;     // +2
  goal: Record<'GK' | 'DEF' | 'MID' | 'FWD', number>; // GK:6, DEF:6, MID:5, FWD:4
  assist: number;             // +3
  clean_sheet: number;        // +4 (DEF/GK seulement, >60min)
  yellow_card: number;        // -1
  red_card: number;           // -3
  goals_conceded_per_2: number; // -1 (GK/DEF)
}
```

**Firestore paths :**

```
artifacts/{APP_ID}/public/data/gameweeks/{gameweekId}
artifacts/{APP_ID}/users/{uid}/lineups/{gameweekId}
artifacts/{APP_ID}/users/{uid}/lineups/{gameweekId}/players/{slot}
artifacts/{APP_ID}/public/data/gameweek_results/{gameweekId}/user_scores/{uid}
```

### 2.2 Hook : `useFantasyTeam.ts`

**Fichier :** `src/hooks/useFantasyTeam.ts`

| Fonction | Description |
|---|---|
| `fetchCurrentGameweek()` | Gameweek en cours (OPEN ou LIVE) |
| `fetchMyLineup(gameweekId)` | Lineup sauvegardé ou nouveau brouillon |
| `saveLineup(lineup, players)` | Sauvegarder la composition (DRAFT → SAVED) |
| `validateFormation(formation, players)` | Vérif : 11 titulaires, positions correctes, min 1GK/3DEF/1FWD (RG-M02) |
| `isCardAvailable(cardId)` | Vérifie que la carte est dans l'inventaire et pas locked (RG-M04) |
| `fetchGameweekResults(gameweekId)` | Points individuels + score total après résolution |

### 2.3 Cloud Function : `resolveGameweek.ts`

**Fichier :** `functions/src/resolveGameweek.ts`

Batch Lundi matin (Cron ou HTTP trigger) :

1. Récupérer les stats réelles des joueurs (Provider API)
2. Pour chaque lineup utilisateur de la gameweek :
   - Calculer les points bruts par joueur titulaire (barème RG-M01)
   - **Algo de remplacement auto (RG-M03)** : si titulaire.minutes == 0, swap avec remplaçant #1 (même poste si possible), sinon #2, #3
   - Capitaine : points × 2
   - Sommer le score total
   - Distribuer rewards (Coins + XP) si score > seuil
3. Update `gameweek.status` → `FINISHED`

**Exporter depuis** `functions/src/index.ts`

### 2.4 Composants UI

| Composant | Fichier | Description |
|---|---|---|
| `FantasyView` | `src/components/fantasy/FantasyView.tsx` | Hub principal : gameweek info, deadline countdown, accès équipe + résultats |
| `TeamEditor` | `src/components/fantasy/TeamEditor.tsx` | Terrain interactif avec slots drag & drop |
| `FormationSelector` | `src/components/fantasy/FormationSelector.tsx` | Dropdown des formations disponibles |
| `PlayerPicker` | `src/components/fantasy/PlayerPicker.tsx` | Modal liste des cartes dispo pour un slot (filtre par poste) |
| `BenchManager` | `src/components/fantasy/BenchManager.tsx` | Gestion du banc avec ordre de priorité (1, 2, 3) |
| `GameweekResults` | `src/components/fantasy/GameweekResults.tsx` | Terrain avec points sous chaque joueur + total + gain coins |

**Réutilisation :** `SoccerPitch.tsx` existant peut servir de base pour `TeamEditor`. Le composant accepte déjà des positions x/y en pourcentage et affiche des joueurs sur un terrain. Il faut l'enrichir avec :
- Slots cliquables (tap → ouvre `PlayerPicker`)
- Indicateurs visuels (points, blessure, forme)
- Distinction titulaire/banc

### 2.5 Tâches Module M

1. Définir les types (Gameweek, Lineup, LineupPlayer, ScoringRules) dans `types.ts`
2. Créer `useFantasyTeam.ts` — `fetchCurrentGameweek`, `fetchMyLineup`, `validateFormation`
3. Créer `FormationSelector.tsx`
4. Créer `TeamEditor.tsx` basé sur `SoccerPitch.tsx` (slots interactifs)
5. Créer `PlayerPicker.tsx` (modal sélection carte par poste)
6. Créer `BenchManager.tsx` (priorité de remplacement)
7. Implémenter `saveLineup()` avec validation (RG-M02, RG-M04)
8. Créer `FantasyView.tsx` (hub + countdown deadline)
9. Créer `resolveGameweek.ts` (Cloud Function scoring + remplacement auto)
10. Créer `GameweekResults.tsx` (affichage post-résolution)
11. Intégrer dans `App.tsx` (vue `FANTASY` + nav)

---

## Phase 3 — Module N : Mode Imaginaire (Blitz 5)

### 3.1 Types & Data Model

**Fichier :** `src/types/types.ts` — ajouter :

```typescript
// --- Module N : Blitz 5 ---
type BlitzStatus = 'OPEN' | 'LIVE' | 'COMPLETED';
type DraftCardTier = 'GOLD' | 'SILVER' | 'BRONZE';

interface BlitzTournament {
  id: string;
  name: string;               // "Spécial LDC - Mardi"
  start_time: string;         // ISO timestamp
  entry_fee: number;          // ex: 100
  rake_percent: number;       // ex: 10 (RG-N03)
  prize_pool: number;         // Cumulé dynamique
  participant_count: number;
  status: BlitzStatus;
  payout_structure: { top_percent: number; share: number }[];
}

interface DraftCard {
  player_reference_id: string;
  player: PlayerReference;    // Réutilisé du Module L
  tier: DraftCardTier;        // GOLD / SILVER / BRONZE
}

interface BlitzEntry {
  id: string;
  tournament_id: string;
  user_id: string;
  draft_pool: DraftCard[];    // 15 cartes proposées (audit)
  selected_lineup: DraftCard[]; // 5 cartes choisies
  total_score: number;
  rank: number;
  win_amount: number;
  created_at: string;         // Timestamp validation (tie-break RG-N05)
}
```

**Firestore paths :**

```
artifacts/{APP_ID}/public/data/blitz_tournaments/{tournamentId}
artifacts/{APP_ID}/users/{uid}/blitz_entries/{tournamentId}
```

### 3.2 Hook : `useBlitz.ts`

**Fichier :** `src/hooks/useBlitz.ts`

| Fonction | Description | Transaction ? |
|---|---|---|
| `fetchTournaments()` | Liste des Blitz ouverts (onSnapshot live) | Non |
| `joinTournament(tournamentId)` | Débit entry_fee, rake 10%, incrément prize_pool, génère pool 15 joueurs (RG-N02) | **Oui** |
| `submitLineup(tournamentId, selectedIds)` | Valider formation 1-1-2-1 (RG-N04), anti-cheat (vérif IDs dans le pool), save | **Oui** |
| `fetchMyEntry(tournamentId)` | Récupérer son entrée (pool + sélection + score) | Non |
| `fetchLeaderboard(tournamentId)` | Classement live du tournoi | Non (onSnapshot) |

**Génération du pool (RNG) — dans `joinTournament` :**
- Sélectionner parmi les joueurs qui jouent ce soir-là
- 5 Gold + 5 Silver + 5 Bronze
- Garantir au moins 2 GK, 2 DEF, 4 MID, 2 FWD (RG-N02)

### 3.3 Cloud Function : `resolveBlitz.ts`

**Fichier :** `functions/src/resolveBlitz.ts`

Trigger : quand tous les matchs du tournoi sont terminés.

1. Pour chaque `blitz_entry` du tournoi :
   - Calculer les points des 5 joueurs (réutiliser le barème RG-M01 du Module M)
   - Update `total_score`
2. Classer tous les participants par score décroissant (tie-break : `created_at` ascendant, RG-N05)
3. Distribuer le prize_pool selon la structure de payout (ex: top 10%)
4. Update `tournament.status` → `COMPLETED`
5. Notifications aux gagnants

**Exporter depuis** `functions/src/index.ts`

### 3.4 Composants UI

| Composant | Fichier | Description |
|---|---|---|
| `BlitzView` | `src/components/blitz/BlitzView.tsx` | Lobby : liste des tournois, timer, participants, pot |
| `BlitzTournamentCard` | `src/components/blitz/BlitzTournamentCard.tsx` | Carte tournoi (titre, timer, entrée, pot, bouton participer) |
| `DraftScreen` | `src/components/blitz/DraftScreen.tsx` | Interface de draft : pool de 15 cartes + 5 slots à remplir |
| `DraftCardDisplay` | `src/components/blitz/DraftCardDisplay.tsx` | Carte draft avec tier (Gold/Silver/Bronze), position, nom |
| `BlitzLeaderboard` | `src/components/blitz/BlitzLeaderboard.tsx` | Classement live : rang, pseudo, points, gain estimé |
| `BlitzResultModal` | `src/components/blitz/BlitzResultModal.tsx` | Modal résultat : position finale, gain, animation victoire |

### 3.5 Tâches Module N

1. Définir les types (BlitzTournament, DraftCard, BlitzEntry) dans `types.ts`
2. Créer `useBlitz.ts` — `fetchTournaments` (onSnapshot)
3. Créer `BlitzTournamentCard.tsx` + `BlitzView.tsx` (lobby)
4. Implémenter `joinTournament()` avec transaction (débit + pool RNG)
5. Créer `DraftScreen.tsx` + `DraftCardDisplay.tsx` (interface de sélection)
6. Implémenter `submitLineup()` avec validation formation 1-1-2-1
7. Créer `BlitzLeaderboard.tsx` (classement live onSnapshot)
8. Créer `resolveBlitz.ts` (Cloud Function résolution + distribution)
9. Créer `BlitzResultModal.tsx` (résultat + animation)
10. Intégrer dans `App.tsx` (vue `BLITZ` + nav)

---

## Composants partagés à créer

Ces éléments sont réutilisés à travers les 3 modules :

| Composant | Usage |
|---|---|
| `CardDisplay.tsx` | L (marketplace), M (team editor), N (draft) |
| `PlayerReference` type | L (cartes), M (scoring), N (draft pool) |
| `CoinTransaction` util | L (achat/vente), M (rewards), N (entry fee + payout) |
| Barème de scoring (RG-M01) | M (gameweek) + N (blitz) — factoriser dans un utilitaire partagé |

---

## Estimation des livrables

| Phase | Module | Fichiers nouveaux | Fichiers modifiés |
|---|---|---|---|
| 1 | L — Marketplace | ~10 (8 composants + 1 hook + 1 mock) | `types.ts`, `App.tsx` |
| 2 | M — Fantasy Team | ~8 (6 composants + 1 hook + 1 Cloud Function) | `types.ts`, `App.tsx`, `functions/src/index.ts` |
| 3 | N — Blitz 5 | ~8 (6 composants + 1 hook + 1 Cloud Function) | `types.ts`, `App.tsx`, `functions/src/index.ts` |
| **Total** | | **~26 fichiers** | **4 fichiers** |

---

## Risques & points d'attention

| Risque | Impact | Mitigation |
|---|---|---|
| **APP_ID mismatch** (`botola-v1` vs `betarena`) | Les Cloud Functions L/M/N n'accèderont pas aux bonnes données | Aligner sur un seul APP_ID avant de commencer |
| **Race conditions marché P2P** (Module L) | Double achat d'une même carte | Transactions Firestore strictes + vérification statut listing |
| **Scoring Provider API** (Modules M/N) | Pas encore d'intégration API-Football/Opta | Créer des mock data pour le scoring en phase dev |
| **Performance leaderboard Blitz** | Tournoi à 1000+ participants | Utiliser `orderBy` + `limit` Firestore, pas de tri côté client |
| **Carte vendue entre compo et lock** (RG-M04) | Équipe invalide au moment du lock | Vérification au moment du lock, retrait auto des cartes vendues |

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = "botola-v1";

// API Configuration
// Reference: https://www.api-football.com/documentation-v3
const API_BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env.SPORTS_API_KEY || "";

// Supported leagues: Botola Pro 1, Ligue 1, Premier League, La Liga, Serie A
const SUPPORTED_LEAGUES: Record<number, string> = {
    200: "Botola Pro",
    61: "Ligue 1",
    39: "Premier League",
    140: "La Liga",
    135: "Serie A",
};

const CURRENT_SEASON = 2024;

// ============================================
// API-FOOTBALL RESPONSE INTERFACES
// ============================================

interface ApiFixture {
    fixture: {
        id: number;
        referee: string | null;
        date: string;
        timestamp: number;
        status: { long: string; short: string; elapsed: number | null };
    };
    league: { id: number; name: string; country: string; logo: string; round: string };
    teams: {
        home: { id: number; name: string; logo: string; winner: boolean | null };
        away: { id: number; name: string; logo: string; winner: boolean | null };
    };
    goals: { home: number | null; away: number | null };
    score: {
        halftime: { home: number | null; away: number | null };
        fulltime: { home: number | null; away: number | null };
        extratime: { home: number | null; away: number | null };
        penalty: { home: number | null; away: number | null };
    };
}

interface ApiEvent {
    time: { elapsed: number; extra: number | null };
    team: { id: number; name: string; logo: string };
    player: { id: number; name: string };
    assist: { id: number | null; name: string | null };
    type: string;
    detail: string;
    comments: string | null;
}

interface ApiLineupPlayer {
    player: { id: number; name: string; number: number; pos: string; grid: string | null };
}

interface ApiLineup {
    team: { id: number; name: string; logo: string };
    formation: string;
    startXI: ApiLineupPlayer[];
    substitutes: ApiLineupPlayer[];
}

interface ApiOddsResponse {
    bookmakers: Array<{
        id: number;
        name: string;
        bets: Array<{
            id: number;
            name: string;
            values: Array<{ value: string; odd: string }>;
        }>;
    }>;
}

interface ApiStanding {
    rank: number;
    team: { id: number; name: string; logo: string };
    points: number;
    goalsDiff: number;
    form: string;
    all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

// ============================================
// STATUS MAPPING
// ============================================

const STATUS_MAP: Record<string, string> = {
    "TBD": "SCHEDULED",
    "NS": "SCHEDULED",
    "1H": "LIVE_1ST_HALF",
    "HT": "HALF_TIME",
    "2H": "LIVE_2ND_HALF",
    "ET": "LIVE_2ND_HALF",
    "BT": "HALF_TIME",
    "P": "LIVE_2ND_HALF",
    "SUSP": "POSTPONED",
    "INT": "LIVE",
    "FT": "FINISHED",
    "AET": "FINISHED",
    "PEN": "FINISHED",
    "PST": "POSTPONED",
    "CANC": "CANCELLED",
    "ABD": "CANCELLED",
    "AWD": "FINISHED",
    "WO": "FINISHED",
};

// ============================================
// GRID TO PITCH COORDINATES
// ============================================

/**
 * API-Football returns player grid positions as "row:column".
 * Row 1 = GK, higher rows = closer to opponent goal.
 * We convert to x,y percentage coordinates for the SoccerPitch component.
 */
function gridToCoordinates(grid: string | null, formation: string): { x: number; y: number } {
    if (!grid) return { x: 50, y: 50 };

    const [row, col] = grid.split(":").map(Number);
    const formationRows = formation.split("-").map(Number);
    const totalRows = formationRows.length + 1; // +1 for GK

    // Y: GK at y=90 (bottom), striker at y=15 (top)
    const y = 90 - ((row - 1) / Math.max(totalRows - 1, 1)) * 75;

    // X: Distribute columns evenly across width
    const playersInThisRow = row === 1 ? 1 : (formationRows[row - 2] || 1);
    if (playersInThisRow <= 1) {
        return { x: 50, y: Math.round(y) };
    }
    const spacing = 80 / (playersInThisRow - 1);
    const x = 10 + (col - 1) * spacing;

    return { x: Math.round(x), y: Math.round(y) };
}

// ============================================
// API FETCH HELPER
// ============================================

async function fetchFromApi(endpoint: string): Promise<any[] | null> {
    if (!API_KEY) {
        logger.warn("SPORTS_API_KEY not configured. Set via: firebase functions:secrets:set SPORTS_API_KEY");
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "x-apisports-key": API_KEY,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const body = await response.text();
            logger.error("API Error", { status: response.status, body, endpoint });
            throw new Error(`API Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
            logger.error("API returned errors", { errors: data.errors, endpoint });
            throw new Error(`API errors: ${JSON.stringify(data.errors)}`);
        }

        logger.info("API fetch OK", { endpoint, results: data.results });
        return data.response;
    } catch (error) {
        logger.error("API Fetch Error", { endpoint, error });
        throw error;
    }
}

// ============================================
// DATA MAPPERS
// ============================================

function mapFixtureToMatch(f: ApiFixture) {
    const kickoffDate = new Date(f.fixture.date);
    const time = kickoffDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Casablanca",
    });

    const apiStatus = f.fixture.status.short;
    const status = STATUS_MAP[apiStatus] || "LIVE";

    return {
        id: `api_${f.fixture.id}`,
        api_id: f.fixture.id,
        competition: SUPPORTED_LEAGUES[f.league.id] || f.league.name,
        league_id: f.league.id,
        league_logo: f.league.logo,
        league_round: f.league.round,
        home: f.teams.home.name,
        away: f.teams.away.name,
        home_id: f.teams.home.id,
        away_id: f.teams.away.id,
        homeLogo: f.teams.home.logo,
        awayLogo: f.teams.away.logo,
        time,
        kickoff_at: admin.firestore.Timestamp.fromMillis(f.fixture.timestamp * 1000),
        status,
        minute: f.fixture.status.elapsed || 0,
        score: {
            h: f.goals.home ?? 0,
            a: f.goals.away ?? 0,
        },
        score_halftime: f.score.halftime,
        score_fulltime: f.score.fulltime,
        score_extratime: f.score.extratime,
        score_penalty: f.score.penalty,
        hadPenaltyShootout: apiStatus === "PEN",
        penaltyScore: f.score.penalty?.home != null ? {
            h: f.score.penalty.home,
            a: f.score.penalty.away ?? 0,
        } : null,
        referee: f.fixture.referee,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
}

function mapEvent(e: ApiEvent, fixtureId: number, homeTeamId: number, index: number) {
    let type = "OTHER";
    if (e.type === "Goal") type = "GOAL";
    else if (e.type === "Card" && e.detail.includes("Yellow")) type = "CARD_YELLOW";
    else if (e.type === "Card" && e.detail.includes("Red")) type = "CARD_RED";
    else if (e.type === "subst") type = "SUBSTITUTION";
    else if (e.type === "Var") type = "VAR";

    const isCancelled = e.type === "Goal" && (
        (e.comments != null && e.comments.includes("cancelled")) ||
        e.detail === "Missed Penalty"
    );

    return {
        id: `evt_${fixtureId}_${e.time.elapsed}_${index}`,
        match_id: `api_${fixtureId}`,
        type,
        minute: e.time.elapsed + (e.time.extra || 0),
        extra_minute: e.time.extra,
        team: e.team.id === homeTeamId ? "home" : "away",
        player_main: e.player?.name || null,
        player_assist: e.assist?.name || null,
        detail: e.detail,
        is_cancelled: isCancelled,
        timestamp: Date.now(),
    };
}

function mapLineup(lineup: ApiLineup, isHome: boolean) {
    const formation = lineup.formation || "4-4-2";

    const starters = lineup.startXI.map((p) => {
        const coords = gridToCoordinates(p.player.grid, formation);
        return {
            name: p.player.name,
            num: p.player.number,
            pos: p.player.pos,
            x: coords.x,
            y: isHome ? coords.y : 100 - coords.y,
        };
    });

    const bench = lineup.substitutes.map((p) => p.player.name);

    return { formation, starters, bench };
}

// ============================================
// FIRESTORE PATH HELPERS
// ============================================

function getMatchRef(matchId: string) {
    return db.collection("artifacts").doc(APP_ID)
        .collection("public").doc("data")
        .collection("matches").doc(matchId);
}

function getEventRef(eventId: string) {
    return db.collection("artifacts").doc(APP_ID)
        .collection("public").doc("data")
        .collection("match_events").doc(eventId);
}

function getStandingsRef(leagueId: number) {
    return db.collection("artifacts").doc(APP_ID)
        .collection("public").doc("data")
        .collection("standings").doc(`league_${leagueId}`);
}

// ============================================
// CLOUD FUNCTIONS
// ============================================

/**
 * Sync fixtures for a specific date across supported leagues.
 * Also fetches pre-match odds.
 */
export const syncFixtures = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const { date, leagueIds } = request.data as { date: string; leagueIds?: number[] };
    if (!date) throw new HttpsError("invalid-argument", "Date is required (YYYY-MM-DD)");

    const leagues = leagueIds || Object.keys(SUPPORTED_LEAGUES).map(Number);
    let totalCount = 0;

    for (const leagueId of leagues) {
        const fixtures = await fetchFromApi(
            `/fixtures?date=${date}&league=${leagueId}&season=${CURRENT_SEASON}`
        );

        if (!fixtures || fixtures.length === 0) continue;

        const batch = db.batch();
        const fixtureIds: number[] = [];

        for (const f of fixtures as ApiFixture[]) {
            const matchData = mapFixtureToMatch(f);
            batch.set(getMatchRef(matchData.id), matchData, { merge: true });
            fixtureIds.push(f.fixture.id);
            totalCount++;
        }

        await batch.commit();

        // Fetch odds for pre-match fixtures (bookmaker 8 = Bet365)
        for (const fixtureId of fixtureIds) {
            try {
                const odds = await fetchFromApi(`/odds?fixture=${fixtureId}&bookmaker=8`) as ApiOddsResponse[] | null;
                if (odds && odds.length > 0) {
                    const matchWinner = odds[0].bookmakers?.[0]?.bets?.find(
                        (b) => b.id === 1
                    );
                    if (matchWinner) {
                        const oddsData: Record<string, number> = {};
                        for (const v of matchWinner.values) {
                            if (v.value === "Home") oddsData.h = parseFloat(v.odd);
                            if (v.value === "Draw") oddsData.n = parseFloat(v.odd);
                            if (v.value === "Away") oddsData.a = parseFloat(v.odd);
                        }
                        if (oddsData.h && oddsData.n && oddsData.a) {
                            await getMatchRef(`api_${fixtureId}`).update({ odds: oddsData });
                        }
                    }
                }
            } catch (err) {
                logger.warn(`Failed to fetch odds for fixture ${fixtureId}`, { err });
            }
        }
    }

    logger.info("syncFixtures completed", { date, totalCount });
    return { success: true, count: totalCount };
});

/**
 * Sync live match details: updated score/status, events, and lineups.
 */
export const syncLiveMatch = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const { apiId } = request.data as { apiId: number };
    if (!apiId) throw new HttpsError("invalid-argument", "apiId is required");

    const matchDocId = `api_${apiId}`;

    // 1. Fetch updated fixture data (score, status, minute)
    const fixtures = await fetchFromApi(`/fixtures?id=${apiId}`) as ApiFixture[] | null;
    if (fixtures && fixtures.length > 0) {
        const matchData = mapFixtureToMatch(fixtures[0]);
        await getMatchRef(matchDocId).set(matchData, { merge: true });
    }

    // Get home team ID for correct event team mapping
    const matchDoc = await getMatchRef(matchDocId).get();
    const homeTeamId = matchDoc.data()?.home_id;

    if (!homeTeamId) {
        throw new HttpsError("not-found", `Match ${matchDocId} not found or missing home_id`);
    }

    // 2. Fetch and sync events
    const events = await fetchFromApi(`/fixtures/events?fixture=${apiId}`) as ApiEvent[] | null;
    if (events && events.length > 0) {
        const batch = db.batch();
        events.forEach((e, index) => {
            const eventData = mapEvent(e, apiId, homeTeamId, index);
            batch.set(getEventRef(eventData.id), eventData, { merge: true });
        });
        await batch.commit();
    }

    // 3. Fetch and sync lineups
    const lineups = await fetchFromApi(`/fixtures/lineups?fixture=${apiId}`) as ApiLineup[] | null;
    if (lineups && lineups.length >= 2) {
        const homeLineup = lineups.find((l) => l.team.id === homeTeamId);
        const awayLineup = lineups.find((l) => l.team.id !== homeTeamId);

        if (homeLineup && awayLineup) {
            await getMatchRef(matchDocId).update({
                lineups: {
                    confirmed: true,
                    home: mapLineup(homeLineup, true),
                    away: mapLineup(awayLineup, false),
                },
            });
        }
    }

    logger.info("syncLiveMatch completed", { apiId, events: events?.length || 0 });
    return { success: true, events: events?.length || 0 };
});

/**
 * Sync standings for supported leagues.
 */
export const syncStandings = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const { leagueId } = request.data as { leagueId?: number };
    const leagues = leagueId ? [leagueId] : Object.keys(SUPPORTED_LEAGUES).map(Number);

    for (const lid of leagues) {
        const response = await fetchFromApi(`/standings?league=${lid}&season=${CURRENT_SEASON}`);
        if (!response || response.length === 0) continue;

        const standings = response[0]?.league?.standings?.[0] as ApiStanding[] | undefined;
        if (!standings) continue;

        const mapped = standings.map((s) => ({
            rank: s.rank,
            team: s.team.name,
            team_id: s.team.id,
            team_logo: s.team.logo,
            points: s.points,
            played: s.all.played,
            won: s.all.win,
            drawn: s.all.draw,
            lost: s.all.lose,
            goals_for: s.all.goals.for,
            goals_against: s.all.goals.against,
            goal_diff: s.goalsDiff,
            form: s.form,
        }));

        await getStandingsRef(lid).set({
            league_id: lid,
            league_name: SUPPORTED_LEAGUES[lid],
            season: CURRENT_SEASON,
            standings: mapped,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    logger.info("syncStandings completed", { leagues });
    return { success: true };
});

/**
 * Sync all currently live matches (events + score updates).
 * Call periodically (every 1-2 minutes) during match days.
 */
export const syncAllLive = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const leagueIds = Object.keys(SUPPORTED_LEAGUES).join("-");
    const fixtures = await fetchFromApi(`/fixtures?live=${leagueIds}`) as ApiFixture[] | null;

    if (!fixtures || fixtures.length === 0) {
        return { success: true, liveCount: 0 };
    }

    for (const f of fixtures) {
        const matchData = mapFixtureToMatch(f);
        await getMatchRef(matchData.id).set(matchData, { merge: true });

        // Fetch events for each live match
        const homeTeamId = f.teams.home.id;
        const events = await fetchFromApi(`/fixtures/events?fixture=${f.fixture.id}`) as ApiEvent[] | null;
        if (events && events.length > 0) {
            const batch = db.batch();
            events.forEach((e, index) => {
                const eventData = mapEvent(e, f.fixture.id, homeTeamId, index);
                batch.set(getEventRef(eventData.id), eventData, { merge: true });
            });
            await batch.commit();
        }
    }

    logger.info("syncAllLive completed", { liveCount: fixtures.length });
    return { success: true, liveCount: fixtures.length };
});

/**
 * Scheduled sync: runs daily at 4 AM (Africa/Casablanca).
 * Syncs today + tomorrow fixtures and all standings.
 */
export const scheduledFixtureSync = onSchedule(
    { schedule: "0 4 * * *", timeZone: "Africa/Casablanca" },
    async () => {
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

        logger.info("Starting scheduled sync", { today, tomorrow });

        const leagues = Object.keys(SUPPORTED_LEAGUES).map(Number);

        // Sync today + tomorrow fixtures
        for (const date of [today, tomorrow]) {
            for (const leagueId of leagues) {
                try {
                    const fixtures = await fetchFromApi(
                        `/fixtures?date=${date}&league=${leagueId}&season=${CURRENT_SEASON}`
                    ) as ApiFixture[] | null;

                    if (fixtures && fixtures.length > 0) {
                        const batch = db.batch();
                        for (const f of fixtures) {
                            const matchData = mapFixtureToMatch(f);
                            batch.set(getMatchRef(matchData.id), matchData, { merge: true });
                        }
                        await batch.commit();
                        logger.info(`Synced ${fixtures.length} fixtures`, { date, leagueId });
                    }
                } catch (err) {
                    logger.error("Scheduled fixture sync error", { date, leagueId, err });
                }
            }
        }

        // Sync standings for all leagues
        for (const leagueId of leagues) {
            try {
                const response = await fetchFromApi(`/standings?league=${leagueId}&season=${CURRENT_SEASON}`);
                if (response && response.length > 0) {
                    const standings = response[0]?.league?.standings?.[0] as ApiStanding[] | undefined;
                    if (standings) {
                        const mapped = standings.map((s) => ({
                            rank: s.rank,
                            team: s.team.name,
                            team_id: s.team.id,
                            team_logo: s.team.logo,
                            points: s.points,
                            played: s.all.played,
                            won: s.all.win,
                            drawn: s.all.draw,
                            lost: s.all.lose,
                            goals_for: s.all.goals.for,
                            goals_against: s.all.goals.against,
                            goal_diff: s.goalsDiff,
                            form: s.form,
                        }));
                        await getStandingsRef(leagueId).set({
                            league_id: leagueId,
                            league_name: SUPPORTED_LEAGUES[leagueId],
                            season: CURRENT_SEASON,
                            standings: mapped,
                            updated_at: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }
                }
            } catch (err) {
                logger.error("Standings sync error", { leagueId, err });
            }
        }

        logger.info("Scheduled sync completed");
    }
);

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = "botola-v1";

// API Configuration
// Reference: https://www.api-football.com/documentation-v3
const API_BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env.SPORTS_API_KEY || "YOUR_API_KEY_HERE";

interface ApiFixture {
    fixture: {
        id: number;
        status: { short: string; elapsed: number };
        date: string;
        timestamp: number;
    };
    league: { id: number; name: string; country: string; logo: string };
    teams: {
        home: { id: number; name: string; logo: string };
        away: { id: number; name: string; logo: string };
    };
    goals: { home: number; away: number };
}

/**
 * Mapper: API-Football Fixture -> BetArena Match
 */
const mapFixtureToMatch = (f: ApiFixture) => {
    // Map API status to our MatchStatus
    // Status list: TBD, NS, 1H, HT, 2H, ET, BT, P, SUSP, INT, FT, AET, PEN, PST, CANC, ABD, AWD, WO
    const statusMap: Record<string, string> = {
        "NS": "SCHEDULED",
        "1H": "LIVE_1ST_HALF",
        "HT": "HALF_TIME",
        "2H": "LIVE_2ND_HALF",
        "FT": "FINISHED",
        "AET": "FINISHED",
        "PEN": "FINISHED",
        "PST": "POSTPONED",
        "CANC": "CANCELLED",
        "ABD": "CANCELLED"
    };

    return {
        id: `api_${f.fixture.id}`,
        api_id: f.fixture.id,
        competition: f.league.name,
        league_id: f.league.id,
        home: f.teams.home.name,
        away: f.teams.away.name,
        homeLogo: f.teams.home.logo,
        awayLogo: f.teams.away.logo,
        time: new Date(f.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kickoff_at: admin.firestore.Timestamp.fromMillis(f.fixture.timestamp * 1000),
        status: statusMap[f.fixture.status.short] || "LIVE",
        minute: f.fixture.status.elapsed || 0,
        score: {
            h: f.goals.home ?? 0,
            a: f.goals.away ?? 0
        },
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
};

/**
 * Fetch data from Football API
 */
async function fetchFromApi(endpoint: string) {
    if (API_KEY === "YOUR_API_KEY_HERE") {
        logger.warn("Sports API Key not configured. Using mock response.");
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "x-apisports-key": API_KEY,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        logger.error("API Fetch Error", { endpoint, error });
        throw error;
    }
}

/**
 * Sync Fixtures for a specific date
 */
export const syncFixtures = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const { date } = request.data; // e.g., "2024-02-07"
    if (!date) throw new HttpsError("invalid-argument", "Date is required");

    // Target Leagues: Botola Pro 1 (200), Premier League (39), La Liga (140)
    const leaguesToSync = [200, 39, 140];
    let totalCount = 0;

    for (const leagueId of leaguesToSync) {
        const fixtures = await fetchFromApi(`/fixtures?date=${date}&league=${leagueId}&season=2024`);

        if (fixtures && fixtures.length > 0) {
            const batch = db.batch();
            fixtures.forEach((f: ApiFixture) => {
                const matchData = mapFixtureToMatch(f);
                const matchRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("matches").doc(matchData.id);
                batch.set(matchRef, matchData, { merge: true });
            });
            await batch.commit();
            totalCount += fixtures.length;
        }
    }

    return { success: true, count: totalCount };
});

/**
 * Sync Live Match Details (Events, Lineups)
 */
export const syncLiveMatch = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const { apiId } = request.data;
    if (!apiId) throw new HttpsError("invalid-argument", "apiId is required");

    // Fetch Events
    const events = await fetchFromApi(`/fixtures/events?fixture=${apiId}`);
    if (events) {
        const batch = db.batch();
        events.forEach((e: any, index: number) => {
            const eventId = `evt_${apiId}_${index}`;
            const eventRef = db.collection("artifacts").doc(APP_ID).collection("public").doc("data").collection("match_events").doc(eventId);

            // Map event type
            let type = "OTHER";
            if (e.type === "Goal") type = "GOAL";
            if (e.type === "Card") type = e.detail === "Yellow Card" ? "YELLOW_CARD" : "RED_CARD";

            batch.set(eventRef, {
                match_id: `api_${apiId}`,
                type,
                minute: e.time.elapsed,
                team: e.team.id === e.team.id ? "home" : "away", // Need to verify team mapping
                player_main: e.player.name,
                player_assist: e.assist?.name,
                timestamp: Date.now()
            }, { merge: true });
        });
        await batch.commit();
    }

    // Fetch specialized lineup data if needed...

    return { success: true };
});

/**
 * Scheduled sync (Every day at 4 AM)
 */
export const scheduledFixtureSync = onSchedule("0 4 * * *", async (event) => {
    const today = new Date().toISOString().split('T')[0];
    logger.info("Starting scheduled fixture sync", { today });

    // In a real scenario, we'd trigger the sync logic here
    // For now, just a placeholder logger
});

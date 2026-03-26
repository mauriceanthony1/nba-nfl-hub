// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
// 2026 NBA Playoffs + 2026-27 NFL Season
// Admin can update teams/games via the admin panel

const DEFAULT_DATA = {
  meta: {
    adminPassword: "playoff2026",
    picksLocked: false,
    liveMode: false,
    users: ["PME", "Phil", "Reece"]
  },

  // ── NBA 2026 PLAYOFFS ────────────────────────────────────────────────────────
  nba: {
    year: 2026,
    rounds: ["First Round", "Second Round", "Conference Finals", "NBA Finals"],
    pointValues: { "First Round": 2, "Second Round": 4, "Conference Finals": 8, "NBA Finals": 16 },

    // East bracket — 4 first-round series
    east: {
      r1: [
        { id: "e1a", round: "First Round", conf: "East", top: { seed: 1, name: "Cavaliers", abbr: "CLE" }, bot: { seed: 8, name: "Pistons",  abbr: "DET" }, wins_top: 0, wins_bot: 0, winner: null, locked: false },
        { id: "e1b", round: "First Round", conf: "East", top: { seed: 2, name: "Celtics",   abbr: "BOS" }, bot: { seed: 7, name: "Heat",     abbr: "MIA" }, wins_top: 0, wins_bot: 0, winner: null, locked: false },
        { id: "e1c", round: "First Round", conf: "East", top: { seed: 3, name: "Knicks",    abbr: "NYK" }, bot: { seed: 6, name: "Bucks",    abbr: "MIL" }, wins_top: 0, wins_bot: 0, winner: null, locked: false },
        { id: "e1d", round: "First Round", conf: "East", top: { seed: 4, name: "Magic",     abbr: "ORL" }, bot: { seed: 5, name: "Pacers",   abbr: "IND" }, wins_top: 0, wins_bot: 0, winner: null, locked: false }
      ],
      r2: [
        { id: "e2a", round: "Second Round", conf: "East", top: { seed: null, name: "TBD", abbr: "???" }, bot: { seed: null, name: "TBD", abbr: "???" }, wins_top: 0, wins_bot: 0, winner: null, locked: false },
        { id: "e2b", round: "Second Round", conf: "East", top: { seed: null, name: "TBD", abbr: "???" }, bot: { seed: null, name: "TBD", abbr: "???" }, wins_top: 0, wins_bot: 0, winner: null, locked: false }
      ],
      r3: [
        { id: "e3a", round: "Conference Finals", conf: "East", top: { seed: null, name: "TBD", abbr: "???" }, bot: { seed: null, name: "TBD", abbr: "???" }, wins_top: 0, wins_bot: 0, winner: null, locked: false }
      ]
    },

    // West bracket — 4 first-round series
    west: {
      r1: [
        { id: "w1a", round: "First Round", conf: "West", top: { seed: 1, name: "Thunder",    abbr: "OKC" }, bot: { seed: 8, name: "Lakers",    abbr: "LAL" }, wins_top: 0, wins_bot: 0, winner: null, locked: false },
        { id: "w1b", round: "First Round", conf: "West", top: { seed: 2, name: "Rockets",    abbr: "HOU" }, bot: { seed: 7, name: "Warriors",  abbr: "GSW" }, wins_top: 0, wins_bot: 0, winner: null, locked: false },
        { id: "w1c", round: "First Round", conf: "West", top: { seed: 3, name: "Mavericks",  abbr: "DAL" }, bot: { seed: 6, name: "Grizzlies", abbr: "MEM" }, wins_top: 0, wins_bot: 0, winner: null, locked: false },
        { id: "w1d", round: "First Round", conf: "West", top: { seed: 4, name: "Nuggets",    abbr: "DEN" }, bot: { seed: 5, name: "T-Wolves",  abbr: "MIN" }, wins_top: 0, wins_bot: 0, winner: null, locked: false }
      ],
      r2: [
        { id: "w2a", round: "Second Round", conf: "West", top: { seed: null, name: "TBD", abbr: "???" }, bot: { seed: null, name: "TBD", abbr: "???" }, wins_top: 0, wins_bot: 0, winner: null, locked: false },
        { id: "w2b", round: "Second Round", conf: "West", top: { seed: null, name: "TBD", abbr: "???" }, bot: { seed: null, name: "TBD", abbr: "???" }, wins_top: 0, wins_bot: 0, winner: null, locked: false }
      ],
      r3: [
        { id: "w3a", round: "Conference Finals", conf: "West", top: { seed: null, name: "TBD", abbr: "???" }, bot: { seed: null, name: "TBD", abbr: "???" }, wins_top: 0, wins_bot: 0, winner: null, locked: false }
      ]
    },

    // NBA Finals
    finals: {
      id: "nba_finals",
      round: "NBA Finals",
      conf: "Finals",
      top: { seed: null, name: "TBD", abbr: "???" },
      bot: { seed: null, name: "TBD", abbr: "???" },
      wins_top: 0, wins_bot: 0,
      winner: null,
      locked: false
    }
  },

  // ── NFL 2026-27 SEASON ───────────────────────────────────────────────────────
  nfl: {
    season: "2026-27",
    superBowl: "Super Bowl LXI",
    teams: {
      // AFC
      "BUF": { name: "Bills",       conf: "AFC", div: "East",  color: "#00338D" },
      "MIA": { name: "Dolphins",    conf: "AFC", div: "East",  color: "#008E97" },
      "NE":  { name: "Patriots",    conf: "AFC", div: "East",  color: "#002244" },
      "NYJ": { name: "Jets",        conf: "AFC", div: "East",  color: "#125740" },
      "BAL": { name: "Ravens",      conf: "AFC", div: "North", color: "#241773" },
      "CIN": { name: "Bengals",     conf: "AFC", div: "North", color: "#FB4F14" },
      "CLE": { name: "Browns",      conf: "AFC", div: "North", color: "#311D00" },
      "PIT": { name: "Steelers",    conf: "AFC", div: "North", color: "#FFB612" },
      "HOU": { name: "Texans",      conf: "AFC", div: "South", color: "#03202F" },
      "IND": { name: "Colts",       conf: "AFC", div: "South", color: "#002C5F" },
      "JAX": { name: "Jaguars",     conf: "AFC", div: "South", color: "#006778" },
      "TEN": { name: "Titans",      conf: "AFC", div: "South", color: "#0C2340" },
      "DEN": { name: "Broncos",     conf: "AFC", div: "West",  color: "#FB4F14" },
      "KC":  { name: "Chiefs",      conf: "AFC", div: "West",  color: "#E31837" },
      "LV":  { name: "Raiders",     conf: "AFC", div: "West",  color: "#000000" },
      "LAC": { name: "Chargers",    conf: "AFC", div: "West",  color: "#0080C6" },
      // NFC
      "DAL": { name: "Cowboys",     conf: "NFC", div: "East",  color: "#041E42" },
      "NYG": { name: "Giants",      conf: "NFC", div: "East",  color: "#0B2265" },
      "PHI": { name: "Eagles",      conf: "NFC", div: "East",  color: "#004C54" },
      "WAS": { name: "Commanders",  conf: "NFC", div: "East",  color: "#5A1414" },
      "CHI": { name: "Bears",       conf: "NFC", div: "North", color: "#0B162A" },
      "DET": { name: "Lions",       conf: "NFC", div: "North", color: "#0076B6" },
      "GB":  { name: "Packers",     conf: "NFC", div: "North", color: "#203731" },
      "MIN": { name: "Vikings",     conf: "NFC", div: "North", color: "#4F2683" },
      "ATL": { name: "Falcons",     conf: "NFC", div: "South", color: "#A71930" },
      "CAR": { name: "Panthers",    conf: "NFC", div: "South", color: "#0085CA" },
      "NO":  { name: "Saints",      conf: "NFC", div: "South", color: "#D3BC8D" },
      "TB":  { name: "Buccaneers",  conf: "NFC", div: "South", color: "#D50A0A" },
      "ARI": { name: "Cardinals",   conf: "NFC", div: "West",  color: "#97233F" },
      "LAR": { name: "Rams",        conf: "NFC", div: "West",  color: "#003594" },
      "SEA": { name: "Seahawks",    conf: "NFC", div: "West",  color: "#002244" },
      "SF":  { name: "49ers",       conf: "NFC", div: "West",  color: "#AA0000" }
    },

    weeks: buildNFLSchedule()
  },

  // ── PICKS ────────────────────────────────────────────────────────────────────
  picks: {
    // keyed by username → { nba: { seriesId: "TEAM_ABBR" }, nfl: { gameId: "TEAM_ABBR" } }
    "PME":   { nba: {}, nfl: {} },
    "Phil":  { nba: {}, nfl: {} },
    "Reece": { nba: {}, nfl: {} }
  }
};

function buildNFLSchedule() {
  const weeks = {};

  // Preseason (3 weeks, Aug 2026)
  for (let w = 1; w <= 3; w++) {
    weeks[`pre${w}`] = {
      label: `Preseason Week ${w}`,
      type: "preseason",
      weekNum: w,
      locked: false,
      games: buildPlaceholderGames(`pre${w}`, 8)
    };
  }

  // Regular season (18 weeks)
  for (let w = 1; w <= 18; w++) {
    weeks[`week${w}`] = {
      label: `Week ${w}`,
      type: "regular",
      weekNum: w,
      locked: false,
      games: buildPlaceholderGames(`week${w}`, w === 9 ? 14 : 16) // week 9 has a bye structure
    };
  }

  // Playoffs
  weeks["wild_card"] = {
    label: "Wild Card Weekend",
    type: "playoff",
    locked: false,
    games: [
      { id: "wc1", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "wc2", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "wc3", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "wc4", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "wc5", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "wc6", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" }
    ]
  };
  weeks["divisional"] = {
    label: "Divisional Round",
    type: "playoff",
    locked: false,
    games: [
      { id: "div1", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "div2", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "div3", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "div4", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" }
    ]
  };
  weeks["conf_champ"] = {
    label: "Conference Championships",
    type: "playoff",
    locked: false,
    games: [
      { id: "afc_champ", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" },
      { id: "nfc_champ", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" }
    ]
  };
  weeks["super_bowl"] = {
    label: "Super Bowl LXI",
    type: "playoff",
    locked: false,
    games: [
      { id: "sb61", away: { abbr: "TBD", name: "TBD" }, home: { abbr: "TBD", name: "TBD" }, score_away: null, score_home: null, winner: null, status: "pre" }
    ]
  };

  return weeks;
}

function buildPlaceholderGames(weekId, count) {
  const games = [];
  for (let i = 1; i <= count; i++) {
    games.push({
      id: `${weekId}_g${i}`,
      away:  { abbr: "TBD", name: "TBD" },
      home:  { abbr: "TBD", name: "TBD" },
      score_away: null,
      score_home: null,
      winner: null,
      status: "pre"   // pre | live | final
    });
  }
  return games;
}

module.exports = { DEFAULT_DATA };

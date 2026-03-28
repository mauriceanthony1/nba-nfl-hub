// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
// 2026 NBA Playoffs + 2026-27 NFL Season + 2026 NCAA Tournament

// ── NCAA 2026 TOURNAMENT ──────────────────────────────────────────────────────
const NCAA_BRACKET = {
  EAST: [
    { id:'E1', seed1:1,  team1:'Duke',          seed2:16, team2:'Siena'            },
    { id:'E2', seed1:8,  team1:'Ohio State',     seed2:9,  team2:'TCU'              },
    { id:'E3', seed1:5,  team1:'St Johns',       seed2:12, team2:'Northern Iowa'    },
    { id:'E4', seed1:4,  team1:'Kansas',         seed2:13, team2:'Cal Baptist'      },
    { id:'E5', seed1:6,  team1:'Louisville',     seed2:11, team2:'South Florida'    },
    { id:'E6', seed1:3,  team1:'Michigan State', seed2:14, team2:'North Dakota State'},
    { id:'E7', seed1:7,  team1:'UCLA',           seed2:10, team2:'UCF'              },
    { id:'E8', seed1:2,  team1:'UConn',          seed2:15, team2:'Furman'           },
  ],
  WEST: [
    { id:'W1', seed1:1,  team1:'Arizona',        seed2:16, team2:'LIU'              },
    { id:'W2', seed1:8,  team1:'Villanova',      seed2:9,  team2:'Utah State'       },
    { id:'W3', seed1:5,  team1:'Wisconsin',      seed2:12, team2:'High Point'       },
    { id:'W4', seed1:4,  team1:'Arkansas',       seed2:13, team2:'Hawaii'           },
    { id:'W5', seed1:6,  team1:'BYU',            seed2:11, team2:'Texas'            },
    { id:'W6', seed1:3,  team1:'Gonzaga',        seed2:14, team2:'Kennesaw State'   },
    { id:'W7', seed1:7,  team1:'Miami FL',       seed2:10, team2:'Missouri'         },
    { id:'W8', seed1:2,  team1:'Purdue',         seed2:15, team2:'Queens'           },
  ],
  SOUTH: [
    { id:'S1', seed1:1,  team1:'Florida',        seed2:16, team2:'Prairie View'     },
    { id:'S2', seed1:8,  team1:'Clemson',        seed2:9,  team2:'Iowa'             },
    { id:'S3', seed1:5,  team1:'Texas Tech',     seed2:12, team2:'Akron'            },
    { id:'S4', seed1:4,  team1:'Alabama',        seed2:13, team2:'Hofstra'          },
    { id:'S5', seed1:6,  team1:'Tennessee',      seed2:11, team2:'VCU'              },
    { id:'S6', seed1:3,  team1:'Virginia',       seed2:14, team2:'Wright State'     },
    { id:'S7', seed1:7,  team1:'Saint Marys',    seed2:10, team2:'NC State'         },
    { id:'S8', seed1:2,  team1:'Houston',        seed2:15, team2:'Idaho'            },
  ],
  MIDWEST: [
    { id:'M1', seed1:1,  team1:'Michigan',       seed2:16, team2:'Howard'           },
    { id:'M2', seed1:8,  team1:'Georgia',        seed2:9,  team2:'Saint Louis'      },
    { id:'M3', seed1:5,  team1:'Nebraska',       seed2:12, team2:'Troy'             },
    { id:'M4', seed1:4,  team1:'Iowa State',     seed2:13, team2:'Lehigh'           },
    { id:'M5', seed1:6,  team1:'SMU',            seed2:11, team2:'Miami OH'         },
    { id:'M6', seed1:3,  team1:'Kentucky',       seed2:14, team2:'Montana State'    },
    { id:'M7', seed1:7,  team1:'Ohio State',     seed2:10, team2:'Santa Clara'      },
    { id:'M8', seed1:2,  team1:'Illinois',       seed2:15, team2:'Tennessee State'  },
  ],
};

const NCAA_SCORING = { R64:1, R32:2, S16:4, E8:8, F4:16, CHIP:32 };
const NCAA_ROUNDS  = ['R64', 'R32', 'S16', 'E8', 'F4', 'CHIP'];

// Pre-seeded picks (loaded into DEFAULT_DATA so they survive reset)
const NCAA_SEED_PICKS = {
  PME: {
    R64:  ['Duke','TCU','St Johns','Kansas','Louisville','Michigan State','UCLA','UConn',
           'Arizona','Utah State','High Point','Arkansas','Texas','Gonzaga','Miami FL','Purdue',
           'Florida','Iowa','Texas Tech','Alabama','Tennessee','Virginia','NC State','Houston',
           'Michigan','Saint Louis','Nebraska','Iowa State','SMU','Kentucky','Santa Clara','Illinois'],
    R32:  ['Duke','St Johns','Michigan State','UConn',
           'Arizona','Arkansas','Texas','Purdue',
           'Iowa','Alabama','Virginia','Houston',
           'Michigan','Nebraska','Kentucky','Illinois'],
    S16:  ['Duke','Michigan State','Arizona','Texas','Alabama','Houston','Michigan','Illinois'],
    E8:   ['Duke','Arizona','Houston','Michigan'],
    F4:   ['Arizona','Houston'],
    CHIP: ['Houston'],
  },
  Phil: {
    R64:  ['Duke','TCU','St Johns','Kansas','Louisville','Michigan State','UCF','UConn',
           'Arizona','Villanova','High Point','Arkansas','Texas','Gonzaga','Miami FL','Purdue',
           'Florida','Clemson','Texas Tech','Alabama','VCU','Virginia','NC State','Houston',
           'Michigan','Saint Louis','Nebraska','Iowa State','SMU','Kentucky','Ohio State','Illinois'],
    R32:  ['TCU','St Johns','Louisville','UConn',
           'Arizona','High Point','Gonzaga','Purdue',
           'Florida','Alabama','VCU','Houston',
           'Michigan','Nebraska','Kentucky','Illinois'],
    S16:  ['St Johns','UConn','High Point','Gonzaga','Alabama','Houston','Michigan','Illinois'],
    E8:   ['St Johns','Gonzaga','Houston','Michigan'],
    F4:   [],
    CHIP: [],
  },
  Reece: {
    R64:  ['Duke','Ohio State','St Johns','Kansas','Louisville','Michigan State','UCLA','UConn',
           'Arizona','Utah State','Wisconsin','Arkansas','BYU','Gonzaga','Miami FL','Purdue',
           'Florida','Iowa','Akron','Alabama','Tennessee','Virginia','Saint Marys','Houston',
           'Michigan','Saint Louis','Nebraska','Iowa State','SMU','Kentucky','Ohio State','Illinois'],
    R32:  ['Duke','St Johns','Michigan State','UConn',
           'Arizona','Arkansas','BYU','Purdue',
           'Florida','Alabama','Tennessee','Houston',
           'Michigan','Nebraska','SMU','Illinois'],
    S16:  ['St Johns','UConn','Arizona','Purdue','Florida','Houston','Michigan','Illinois'],
    E8:   ['St Johns','Arizona','Houston','Michigan'],
    F4:   ['Arizona','Houston'],
    CHIP: ['Houston'],
  },
};

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

  // ── PICKS (NBA + NFL) ────────────────────────────────────────────────────────
  picks: {
    "PME":   { nba: {}, nfl: {} },
    "Phil":  { nba: {}, nfl: {} },
    "Reece": { nba: {}, nfl: {} }
  },

  // ── NCAA 2026 TOURNAMENT ─────────────────────────────────────────────────────
  // picks: keyed by user → { R64:[32], R32:[16], S16:[8], E8:[4], F4:[2], CHIP:[1] }
  // results: keyed by round → { [gi]: winner_team_name }
  ncaa: {
    picksLocked: false,
    results: {},
    picks: {
      PME:   JSON.parse(JSON.stringify(NCAA_SEED_PICKS.PME)),
      Phil:  JSON.parse(JSON.stringify(NCAA_SEED_PICKS.Phil)),
      Reece: JSON.parse(JSON.stringify(NCAA_SEED_PICKS.Reece)),
    }
  }
};

function buildNFLSchedule() {
  const weeks = {};

  for (let w = 1; w <= 3; w++) {
    weeks[`pre${w}`] = {
      label: `Preseason Week ${w}`,
      type: "preseason",
      weekNum: w,
      locked: false,
      games: buildPlaceholderGames(`pre${w}`, 8)
    };
  }

  for (let w = 1; w <= 18; w++) {
    weeks[`week${w}`] = {
      label: `Week ${w}`,
      type: "regular",
      weekNum: w,
      locked: false,
      games: buildPlaceholderGames(`week${w}`, w === 9 ? 14 : 16)
    };
  }

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
      status: "pre"
    });
  }
  return games;
}

module.exports = { DEFAULT_DATA, NCAA_BRACKET, NCAA_SCORING, NCAA_ROUNDS };

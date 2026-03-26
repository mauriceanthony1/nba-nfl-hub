const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { DEFAULT_DATA } = require('./data');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'picks.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────
function loadData() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('loadData error:', e.message);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('saveData error:', e.message);
  }
}

// ─── SERVER-SENT EVENTS ───────────────────────────────────────────────────────
let clients = [];

function broadcast(event, payload) {
  const msg = `data: ${JSON.stringify({ event, payload })}\n\n`;
  clients.forEach(c => { try { c.res.write(msg); } catch (_) {} });
}

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const client = { id: Date.now() + Math.random(), res };
  clients.push(client);

  // Send full state on connect
  const data = loadData();
  res.write(`data: ${JSON.stringify({ event: 'init', payload: data })}\n\n`);

  // Heartbeat every 25s to keep connection alive
  const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) {} }, 25000);

  req.on('close', () => {
    clearInterval(hb);
    clients = clients.filter(c => c.id !== client.id);
  });
});

// ─── READ ENDPOINTS ───────────────────────────────────────────────────────────
app.get('/api/data', (req, res) => {
  res.json(loadData());
});

// ─── PICKS ────────────────────────────────────────────────────────────────────
// POST /api/pick  { user, sport, id, pick }
app.post('/api/pick', (req, res) => {
  const { user, sport, id, pick } = req.body;
  const data = loadData();

  if (data.meta.picksLocked) return res.status(403).json({ error: 'Picks are locked' });
  if (!data.meta.users.includes(user)) return res.status(400).json({ error: 'Unknown user' });
  if (!['nba', 'nfl'].includes(sport)) return res.status(400).json({ error: 'Unknown sport' });

  if (!data.picks[user]) data.picks[user] = { nba: {}, nfl: {} };
  if (!data.picks[user][sport]) data.picks[user][sport] = {};

  // Toggle: if already picked same → remove
  if (data.picks[user][sport][id] === pick) {
    delete data.picks[user][sport][id];
  } else {
    data.picks[user][sport][id] = pick;
  }

  saveData(data);
  broadcast('picks_update', { user, sport, id, pick: data.picks[user][sport][id] || null });
  res.json({ ok: true });
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const { password } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  req.appData = data;
  next();
}

// Lock / unlock picks
app.post('/api/admin/lock', (req, res) => {
  const { password, locked } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  data.meta.picksLocked = !!locked;
  saveData(data);
  broadcast('lock_update', { locked: data.meta.picksLocked });
  res.json({ ok: true, locked: data.meta.picksLocked });
});

// Toggle live mode
app.post('/api/admin/live', (req, res) => {
  const { password, live } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  data.meta.liveMode = !!live;
  saveData(data);
  broadcast('live_update', { live: data.meta.liveMode });
  res.json({ ok: true, live: data.meta.liveMode });
});

// Add user
app.post('/api/admin/users/add', (req, res) => {
  const { password, username } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  const name = (username || '').trim();
  if (!name) return res.status(400).json({ error: 'Empty username' });
  if (data.meta.users.includes(name)) return res.status(400).json({ error: 'User exists' });
  data.meta.users.push(name);
  if (!data.picks[name]) data.picks[name] = { nba: {}, nfl: {} };
  saveData(data);
  broadcast('users_update', { users: data.meta.users });
  res.json({ ok: true, users: data.meta.users });
});

// Remove user
app.post('/api/admin/users/remove', (req, res) => {
  const { password, username } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  data.meta.users = data.meta.users.filter(u => u !== username);
  saveData(data);
  broadcast('users_update', { users: data.meta.users });
  res.json({ ok: true, users: data.meta.users });
});

// Change admin password
app.post('/api/admin/password', (req, res) => {
  const { password, newPassword } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Password too short' });
  data.meta.adminPassword = newPassword;
  saveData(data);
  res.json({ ok: true });
});

// ─── UPDATE NBA SERIES SCORE ──────────────────────────────────────────────────
app.post('/api/admin/nba/series', (req, res) => {
  const { password, id, wins_top, wins_bot, winner, locked } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });

  // Search all series
  const allSeries = [
    ...data.nba.east.r1, ...data.nba.east.r2, ...data.nba.east.r3,
    ...data.nba.west.r1, ...data.nba.west.r2, ...data.nba.west.r3,
    data.nba.finals
  ];
  const series = allSeries.find(s => s.id === id);
  if (!series) return res.status(404).json({ error: 'Series not found' });

  if (wins_top !== undefined) series.wins_top = wins_top;
  if (wins_bot !== undefined) series.wins_bot = wins_bot;
  if (winner  !== undefined) series.winner = winner;
  if (locked  !== undefined) series.locked = locked;

  saveData(data);
  broadcast('nba_update', { nba: data.nba });
  res.json({ ok: true });
});

// ─── UPDATE NBA TEAM NAMES (for bracket setup) ────────────────────────────────
app.post('/api/admin/nba/team', (req, res) => {
  const { password, seriesId, side, name, abbr, seed } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });

  const allSeries = [
    ...data.nba.east.r1, ...data.nba.east.r2, ...data.nba.east.r3,
    ...data.nba.west.r1, ...data.nba.west.r2, ...data.nba.west.r3,
    data.nba.finals
  ];
  const series = allSeries.find(s => s.id === seriesId);
  if (!series) return res.status(404).json({ error: 'Series not found' });

  const target = side === 'top' ? series.top : series.bot;
  if (name  !== undefined) target.name = name;
  if (abbr  !== undefined) target.abbr = abbr;
  if (seed  !== undefined) target.seed = seed;

  saveData(data);
  broadcast('nba_update', { nba: data.nba });
  res.json({ ok: true });
});

// ─── UPDATE NFL GAME ──────────────────────────────────────────────────────────
app.post('/api/admin/nfl/game', (req, res) => {
  const { password, weekId, gameId, away, home, score_away, score_home, winner, status } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });

  const week = data.nfl.weeks[weekId];
  if (!week) return res.status(404).json({ error: 'Week not found' });

  const game = week.games.find(g => g.id === gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  if (away        !== undefined) game.away        = away;
  if (home        !== undefined) game.home        = home;
  if (score_away  !== undefined) game.score_away  = score_away;
  if (score_home  !== undefined) game.score_home  = score_home;
  if (winner      !== undefined) game.winner      = winner;
  if (status      !== undefined) game.status      = status;

  saveData(data);
  broadcast('nfl_update', { weekId, week });
  res.json({ ok: true });
});

// Lock/unlock a specific NFL week
app.post('/api/admin/nfl/week/lock', (req, res) => {
  const { password, weekId, locked } = req.body;
  const data = loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  const week = data.nfl.weeks[weekId];
  if (!week) return res.status(404).json({ error: 'Week not found' });
  week.locked = !!locked;
  saveData(data);
  broadcast('nfl_update', { weekId, week });
  res.json({ ok: true });
});

// ─── LIVE DATA PROXY ──────────────────────────────────────────────────────────
// Proxy ESPN API so browser can hit it without CORS issues
app.get('/api/live/nba', (req, res) => {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
  proxyESPN(url, res);
});

app.get('/api/live/nfl', (req, res) => {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
  proxyESPN(url, res);
});

app.get('/api/live/nba/team/:abbr', (req, res) => {
  // ESPN team lookup by abbreviation
  const abbr = req.params.abbr.toLowerCase();
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${abbr}`;
  proxyESPN(url, res);
});

app.get('/api/live/nfl/team/:abbr', (req, res) => {
  const abbr = req.params.abbr.toLowerCase();
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbr}`;
  proxyESPN(url, res);
});

function proxyESPN(url, res) {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (apiRes) => {
    let body = '';
    apiRes.on('data', chunk => body += chunk);
    apiRes.on('end', () => {
      try {
        res.json(JSON.parse(body));
      } catch (e) {
        res.status(500).json({ error: 'ESPN parse error' });
      }
    });
  }).on('error', err => {
    res.status(502).json({ error: err.message });
  });
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
  const data = loadData();
  const scores = {};

  for (const user of data.meta.users) {
    scores[user] = { total: 0, nba: 0, nfl: 0 };
    const userPicks = data.picks[user] || { nba: {}, nfl: {} };

    // ── NBA scoring ──────────────────────────────────────────────────────────
    const nbaPoints = data.nba.pointValues;
    const allSeries = [
      ...data.nba.east.r1, ...data.nba.east.r2, ...data.nba.east.r3,
      ...data.nba.west.r1, ...data.nba.west.r2, ...data.nba.west.r3,
      data.nba.finals
    ];
    for (const series of allSeries) {
      if (series.winner && userPicks.nba[series.id] === series.winner) {
        const pts = nbaPoints[series.round] || 2;
        scores[user].nba   += pts;
        scores[user].total += pts;
      }
    }

    // ── NFL scoring ──────────────────────────────────────────────────────────
    for (const [weekId, week] of Object.entries(data.nfl.weeks)) {
      const isPlayoff = week.type === 'playoff';
      const pts = isPlayoff ? 3 : 1; // more points for playoff games
      for (const game of week.games) {
        if (game.winner && userPicks.nfl[game.id] === game.winner) {
          scores[user].nfl   += pts;
          scores[user].total += pts;
        }
      }
    }
  }

  // Sort by total descending
  const board = Object.entries(scores)
    .map(([user, s]) => ({ user, ...s }))
    .sort((a, b) => b.total - a.total)
    .map((row, i) => ({ rank: i + 1, ...row }));

  res.json(board);
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏀🏈  NBA/NFL Hub running on port ${PORT}`);
  // Ensure data file exists
  loadData();
});

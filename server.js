const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { DEFAULT_DATA, NCAA_BRACKET, NCAA_SCORING, NCAA_ROUNDS } = require('./data');

// Region offsets for flat bracket arrays
const NCAA_ROFF = {
  EAST:    { R64:0,  R32:0,  S16:0, E8:0 },
  WEST:    { R64:8,  R32:4,  S16:2, E8:1 },
  SOUTH:   { R64:16, R32:8,  S16:4, E8:2 },
  MIDWEST: { R64:24, R32:12, S16:6, E8:3 },
};

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_KEY;
const SB_TABLE = 'nba_nfl_state';
const SB_ROW_ID = 'main';

// In-memory cache so we don't hit Supabase on every request
let memCache = null;

// Supabase helpers (same pattern as eversbracket2)
async function sbFetch(path_, opts = {}) {
  if (!SB_URL || !SB_KEY) return null;
  const url = `${SB_URL}/rest/v1/${path_}`;
  const headers = {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
    ...opts.headers
  };
  try {
    return await new Promise((resolve, reject) => {
      const u = new URL(url);
      const options = {
        hostname: u.hostname, path: u.pathname + u.search,
        method: opts.method || 'GET', headers
      };
      const req = https.request(options, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => resolve({ ok: res.statusCode < 300, status: res.statusCode, text: body }));
      });
      req.on('error', reject);
      if (opts.body) req.write(opts.body);
      req.end();
    });
  } catch (e) {
    console.error('sbFetch error:', e.message);
    return null;
  }
}

// Generic table reader — used to pull from eversbracket2's tables in shared Supabase
async function sbFetchRaw(table) {
  const res = await sbFetch(`${table}?select=*`);
  if (!res || !res.ok) return null;
  try { return JSON.parse(res.text); } catch { return null; }
}

async function sbLoad() {
  const res = await sbFetch(`${SB_TABLE}?id=eq.${SB_ROW_ID}&select=state`);
  if (!res || !res.ok) return null;
  try {
    const rows = JSON.parse(res.text);
    if (Array.isArray(rows) && rows.length > 0) return rows[0].state;
  } catch (_) {}
  return null;
}

async function sbSave(data) {
  const body = JSON.stringify({ id: SB_ROW_ID, state: data });
  const res = await sbFetch(SB_TABLE, { method: 'POST', body });
  return res && res.ok;
}

// ─── LOCAL FILE FALLBACK ──────────────────────────────────────────────────────
const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'picks.json');

function fileLoad() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      const d = JSON.parse(JSON.stringify(DEFAULT_DATA));
      fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
      return d;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('fileLoad error:', e.message);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function fileSave(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('fileSave error:', e.message);
  }
}

// ─── UNIFIED LOAD / SAVE ──────────────────────────────────────────────────────
async function loadData() {
  if (memCache) return memCache;

  if (SB_URL && SB_KEY) {
    const d = await sbLoad();
    if (d) {
      // Migrate: back-fill any top-level keys that didn't exist when state was first saved
      let migrated = false;
      if (!d.ncaa) {
        d.ncaa = JSON.parse(JSON.stringify(DEFAULT_DATA.ncaa));
        migrated = true;
      }
      if (!d.meta)   { d.meta   = DEFAULT_DATA.meta;   migrated = true; }
      if (!d.picks)  { d.picks  = DEFAULT_DATA.picks;  migrated = true; }
      if (migrated) await sbSave(d);
      memCache = d;
      return d;
    }
    // Supabase empty or error — seed with defaults
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
    await sbSave(fresh);
    memCache = fresh;
    return fresh;
  }

  // No Supabase — use local file
  const d = fileLoad();
  memCache = d;
  return d;
}

async function saveData(data) {
  memCache = data;
  if (SB_URL && SB_KEY) {
    await sbSave(data);
  } else {
    fileSave(data);
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── SERVER-SENT EVENTS ───────────────────────────────────────────────────────
let clients = [];

function broadcast(event, payload) {
  const msg = `data: ${JSON.stringify({ event, payload })}\n\n`;
  clients.forEach(c => { try { c.res.write(msg); } catch (_) {} });
}

app.get('/api/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const client = { id: Date.now() + Math.random(), res };
  clients.push(client);

  const data = await loadData();
  res.write(`data: ${JSON.stringify({ event: 'init', payload: data })}\n\n`);

  const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) {} }, 25000);
  req.on('close', () => {
    clearInterval(hb);
    clients = clients.filter(c => c.id !== client.id);
  });
});

// ─── READ ENDPOINTS ───────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  res.json(await loadData());
});

// ─── PICKS ────────────────────────────────────────────────────────────────────
app.post('/api/pick', async (req, res) => {
  const { user, sport, id, pick } = req.body;
  const data = await loadData();

  if (data.meta.picksLocked) return res.status(403).json({ error: 'Picks are locked' });
  if (!data.meta.users.includes(user)) return res.status(400).json({ error: 'Unknown user' });
  if (!['nba', 'nfl'].includes(sport)) return res.status(400).json({ error: 'Unknown sport' });

  if (!data.picks[user]) data.picks[user] = { nba: {}, nfl: {} };
  if (!data.picks[user][sport]) data.picks[user][sport] = {};

  if (data.picks[user][sport][id] === pick) {
    delete data.picks[user][sport][id];
  } else {
    data.picks[user][sport][id] = pick;
  }

  await saveData(data);
  broadcast('picks_update', { user, sport, id, pick: data.picks[user][sport][id] || null });
  res.json({ ok: true });
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────
app.post('/api/admin/lock', async (req, res) => {
  const { password, locked } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  data.meta.picksLocked = !!locked;
  await saveData(data);
  broadcast('lock_update', { locked: data.meta.picksLocked });
  res.json({ ok: true, locked: data.meta.picksLocked });
});

app.post('/api/admin/live', async (req, res) => {
  const { password, live } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  data.meta.liveMode = !!live;
  await saveData(data);
  broadcast('live_update', { live: data.meta.liveMode });
  res.json({ ok: true, live: data.meta.liveMode });
});

app.post('/api/admin/users/add', async (req, res) => {
  const { password, username } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  const name = (username || '').trim();
  if (!name) return res.status(400).json({ error: 'Empty username' });
  if (data.meta.users.includes(name)) return res.status(400).json({ error: 'User exists' });
  data.meta.users.push(name);
  if (!data.picks[name]) data.picks[name] = { nba: {}, nfl: {} };
  await saveData(data);
  broadcast('users_update', { users: data.meta.users });
  res.json({ ok: true, users: data.meta.users });
});

app.post('/api/admin/users/remove', async (req, res) => {
  const { password, username } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  data.meta.users = data.meta.users.filter(u => u !== username);
  await saveData(data);
  broadcast('users_update', { users: data.meta.users });
  res.json({ ok: true, users: data.meta.users });
});

app.post('/api/admin/password', async (req, res) => {
  const { password, newPassword } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Password too short' });
  data.meta.adminPassword = newPassword;
  await saveData(data);
  res.json({ ok: true });
});

// ─── NBA ADMIN ────────────────────────────────────────────────────────────────
app.post('/api/admin/nba/series', async (req, res) => {
  const { password, id, wins_top, wins_bot, winner, locked } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });

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

  await saveData(data);
  broadcast('nba_update', { nba: data.nba });
  res.json({ ok: true });
});

app.post('/api/admin/nba/team', async (req, res) => {
  const { password, seriesId, side, name, abbr, seed } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });

  const allSeries = [
    ...data.nba.east.r1, ...data.nba.east.r2, ...data.nba.east.r3,
    ...data.nba.west.r1, ...data.nba.west.r2, ...data.nba.west.r3,
    data.nba.finals
  ];
  const series = allSeries.find(s => s.id === seriesId);
  if (!series) return res.status(404).json({ error: 'Series not found' });

  const target = side === 'top' ? series.top : series.bot;
  if (name !== undefined) target.name = name;
  if (abbr !== undefined) target.abbr = abbr;
  if (seed !== undefined) target.seed = seed;

  await saveData(data);
  broadcast('nba_update', { nba: data.nba });
  res.json({ ok: true });
});

// ─── NFL ADMIN ────────────────────────────────────────────────────────────────
app.post('/api/admin/nfl/game', async (req, res) => {
  const { password, weekId, gameId, away, home, score_away, score_home, winner, status } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });

  const week = data.nfl.weeks[weekId];
  if (!week) return res.status(404).json({ error: 'Week not found' });

  const game = week.games.find(g => g.id === gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  if (away       !== undefined) game.away       = away;
  if (home       !== undefined) game.home       = home;
  if (score_away !== undefined) game.score_away = score_away;
  if (score_home !== undefined) game.score_home = score_home;
  if (winner     !== undefined) game.winner     = winner;
  if (status     !== undefined) game.status     = status;

  await saveData(data);
  broadcast('nfl_update', { weekId, week });
  res.json({ ok: true });
});

app.post('/api/admin/nfl/week/lock', async (req, res) => {
  const { password, weekId, locked } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  const week = data.nfl.weeks[weekId];
  if (!week) return res.status(404).json({ error: 'Week not found' });
  week.locked = !!locked;
  await saveData(data);
  broadcast('nfl_update', { weekId, week });
  res.json({ ok: true });
});

// ─── ESPN PROXY ───────────────────────────────────────────────────────────────
app.get('/api/live/nba', (req, res) => {
  proxyESPN('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard', res);
});
app.get('/api/live/nfl', (req, res) => {
  proxyESPN('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', res);
});
app.get('/api/live/ncaa', (req, res) => {
  proxyESPN('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&limit=100', res);
});
app.get('/api/live/nba/team/:abbr', (req, res) => {
  proxyESPN(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${req.params.abbr.toLowerCase()}`, res);
});
app.get('/api/live/nfl/team/:abbr', (req, res) => {
  proxyESPN(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${req.params.abbr.toLowerCase()}`, res);
});

function proxyESPN(url, res) {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (apiRes) => {
    let body = '';
    apiRes.on('data', chunk => body += chunk);
    apiRes.on('end', () => {
      try { res.json(JSON.parse(body)); }
      catch (e) { res.status(500).json({ error: 'ESPN parse error' }); }
    });
  }).on('error', err => res.status(502).json({ error: err.message }));
}

// ─── ESPN AUTO-SCORING ────────────────────────────────────────────────────────
// Fetch ESPN data as parsed JSON (server-side)
async function espnFetch(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

// Normalize a team name for fuzzy matching
function normTeam(s) {
  return (s || '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(university|college|the|of|at|in|st\.?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two team names refer to the same team
function teamMatch(a, b) {
  if (!a || !b) return false;
  const na = normTeam(a), nb = normTeam(b);
  if (na === nb) return true;
  // One contains the other (handles "Ohio State" vs "Ohio St")
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  // First word match (last resort)
  const wa = na.split(' ')[0], wb = nb.split(' ')[0];
  return wa === wb && wa.length >= 4;
}

// ── NCAA Auto-Score ───────────────────────────────────────────────────────────
async function autoScoreNCAA() {
  const espn = await espnFetch(
    'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&limit=100'
  );
  if (!espn?.events?.length) return;

  const data = await loadData();
  if (!data.ncaa) return;
  if (!data.ncaa.results) data.ncaa.results = {};

  let changed = false;
  const res = data.ncaa.results;

  // Build expected matchups for rounds after R64 using current results
  function expectedMatchups(round) {
    const m = {};
    const prev = NCAA_ROUNDS[NCAA_ROUNDS.indexOf(round) - 1];
    const prevRes = res[prev] || {};
    const regions = ['EAST','WEST','SOUTH','MIDWEST'];

    if (round === 'R32') {
      for (const rgn of regions) {
        const ro = NCAA_ROFF[rgn];
        for (let i = 0; i < 4; i++) {
          const gi = ro.R32 + i;
          const t1 = prevRes[String(ro.R64 + i * 2)];
          const t2 = prevRes[String(ro.R64 + i * 2 + 1)];
          if (t1 && t2) m[gi] = [t1, t2];
        }
      }
    } else if (round === 'S16') {
      const r32res = res.R32 || {};
      for (const rgn of regions) {
        const ro = NCAA_ROFF[rgn];
        for (let i = 0; i < 2; i++) {
          const gi = ro.S16 + i;
          const t1 = r32res[String(ro.R32 + i * 2)];
          const t2 = r32res[String(ro.R32 + i * 2 + 1)];
          if (t1 && t2) m[gi] = [t1, t2];
        }
      }
    } else if (round === 'E8') {
      const s16res = res.S16 || {};
      for (const rgn of regions) {
        const ro = NCAA_ROFF[rgn];
        const t1 = s16res[String(ro.S16)];
        const t2 = s16res[String(ro.S16 + 1)];
        if (t1 && t2) m[ro.E8] = [t1, t2];
      }
    } else if (round === 'F4') {
      const e8res = res.E8 || {};
      if (e8res['0'] && e8res['1']) m[0] = [e8res['0'], e8res['1']];
      if (e8res['2'] && e8res['3']) m[1] = [e8res['2'], e8res['3']];
    } else if (round === 'CHIP') {
      const f4res = res.F4 || {};
      if (f4res['0'] && f4res['1']) m[0] = [f4res['0'], f4res['1']];
    }
    return m;
  }

  for (const event of espn.events) {
    if (event.status?.type?.name !== 'STATUS_FINAL') continue;
    const comp = event.competitions?.[0];
    if (!comp?.competitors?.length) continue;

    const [c1, c2] = comp.competitors;
    const espn1 = c1.team.displayName || c1.team.shortDisplayName || '';
    const espn2 = c2.team.displayName || c2.team.shortDisplayName || '';
    const s1 = parseInt(c1.score) || 0;
    const s2 = parseInt(c2.score) || 0;
    const espnWinner = s1 > s2 ? espn1 : espn2;

    // Try each round
    for (const round of NCAA_ROUNDS) {
      if (round === 'R64') {
        // Match by comparing to the predefined bracket
        for (const rgn of ['EAST','WEST','SOUTH','MIDWEST']) {
          const games = NCAA_BRACKET[rgn];
          const ro = NCAA_ROFF[rgn];
          for (let i = 0; i < 8; i++) {
            const g = games[i];
            const gi = ro.R64 + i;
            if (res.R64 && res.R64[String(gi)]) continue; // already set
            if (
              (teamMatch(g.team1, espn1) && teamMatch(g.team2, espn2)) ||
              (teamMatch(g.team1, espn2) && teamMatch(g.team2, espn1))
            ) {
              const winner = teamMatch(g.team1, espnWinner) ? g.team1 : g.team2;
              if (!res.R64) res.R64 = {};
              if (res.R64[String(gi)] !== winner) { res.R64[String(gi)] = winner; changed = true; }
            }
          }
        }
      } else {
        // For R32-CHIP: use expected matchups from previous round results
        const exp = expectedMatchups(round);
        for (const [gi, [t1, t2]] of Object.entries(exp)) {
          if (res[round] && res[round][gi]) continue; // already set
          if (
            (teamMatch(t1, espn1) && teamMatch(t2, espn2)) ||
            (teamMatch(t1, espn2) && teamMatch(t2, espn1))
          ) {
            const winner = teamMatch(t1, espnWinner) ? t1 : t2;
            if (!res[round]) res[round] = {};
            if (res[round][gi] !== winner) { res[round][gi] = winner; changed = true; }
          }
        }
      }
    }
  }

  if (changed) {
    data.ncaa.results = res;
    await saveData(data);
    broadcast('ncaa_results_update', { results: res });
    console.log('🎓 NCAA auto-scored from ESPN');
  }
}

// ── NBA Auto-Score (playoff series wins) ─────────────────────────────────────
async function autoScoreNBA() {
  const espn = await espnFetch(
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'
  );
  if (!espn?.events?.length) return;

  const data = await loadData();
  const allSeries = [
    ...data.nba.east.r1, ...data.nba.east.r2, ...data.nba.east.r3,
    ...data.nba.west.r1, ...data.nba.west.r2, ...data.nba.west.r3,
    data.nba.finals
  ];
  let changed = false;

  for (const event of espn.events) {
    if (event.status?.type?.state !== 'post') continue; // only completed games
    const comp = event.competitions?.[0];
    if (!comp) continue;

    const [c1, c2] = comp.competitors;
    const abbr1 = (c1.team.abbreviation || '').toUpperCase();
    const abbr2 = (c2.team.abbreviation || '').toUpperCase();
    const name1 = c1.team.displayName || '';
    const name2 = c2.team.displayName || '';
    const s1 = parseInt(c1.score) || 0;
    const s2 = parseInt(c2.score) || 0;

    // Find matching series (by team abbreviation or name)
    for (const series of allSeries) {
      if (series.winner) continue; // series already decided
      const topAbbr = series.top.abbr, botAbbr = series.bot.abbr;
      const topName = series.top.name, botName = series.bot.name;

      const topEspn = (topAbbr === abbr1 || topAbbr === abbr2 || teamMatch(topName, name1) || teamMatch(topName, name2));
      const botEspn = (botAbbr === abbr1 || botAbbr === abbr2 || teamMatch(botName, name1) || teamMatch(botName, name2));

      if (!topEspn || !botEspn) continue;

      // Parse series summary for wins
      const summary = comp.series?.summary || event.competitions?.[0]?.series?.summary || '';
      // e.g. "BOS leads 3-1" or "Tied 2-2" or "HOU wins 4-2"
      const leadMatch = summary.match(/(\w+)\s+(?:leads|wins)\s+(\d+)-(\d+)/i);
      const tiedMatch = summary.match(/tied\s+(\d+)-(\d+)/i);

      if (leadMatch || tiedMatch) {
        let winsTop = 0, winsBot = 0, winner = null;
        if (tiedMatch) {
          winsTop = parseInt(tiedMatch[1]);
          winsBot = parseInt(tiedMatch[1]);
        } else {
          const leaderAbbr = leadMatch[1].toUpperCase();
          const w1 = parseInt(leadMatch[2]), w2 = parseInt(leadMatch[3]);
          const leaderIsTop = leaderAbbr === topAbbr || (topAbbr !== botAbbr && teamMatch(topName, leadMatch[1]));
          winsTop = leaderIsTop ? w1 : w2;
          winsBot = leaderIsTop ? w2 : w1;
          if (w1 >= 4) winner = leaderIsTop ? topAbbr : botAbbr;
        }
        if (series.wins_top !== winsTop || series.wins_bot !== winsBot || series.winner !== winner) {
          series.wins_top = winsTop;
          series.wins_bot = winsBot;
          if (winner) series.winner = winner;
          changed = true;
        }
      } else {
        // No series summary — update from current game score if final
        const topIsHome = (topAbbr === abbr2 || teamMatch(topName, name2));
        const topScore  = topIsHome ? s2 : s1;
        const botScore  = topIsHome ? s1 : s2;
        // Just record current scores, don't change wins (we don't know total)
      }
    }
  }

  if (changed) {
    await saveData(data);
    broadcast('nba_update', { nba: data.nba });
    console.log('🏀 NBA auto-scored from ESPN');
  }
}

// ── NFL Auto-Score ────────────────────────────────────────────────────────────
async function autoScoreNFL() {
  const espn = await espnFetch(
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
  );
  if (!espn?.events?.length) return;

  const data = await loadData();
  let changed = false;

  // Collect all weeks' games into a flat lookup by team pair
  for (const event of espn.events) {
    const isFinal = event.status?.type?.name === 'STATUS_FINAL';
    const isLive  = event.status?.type?.state === 'in';
    if (!isFinal && !isLive) continue;

    const comp = event.competitions?.[0];
    if (!comp) continue;
    const [c1, c2] = comp.competitors;

    const abbr1 = (c1.team.abbreviation || '').toUpperCase();
    const abbr2 = (c2.team.abbreviation || '').toUpperCase();
    const s1 = parseInt(c1.score) || 0;
    const s2 = parseInt(c2.score) || 0;
    const c1IsHome = c1.homeAway === 'home';
    const homeAbbr = c1IsHome ? abbr1 : abbr2;
    const awayAbbr = c1IsHome ? abbr2 : abbr1;
    const homeScore = c1IsHome ? s1 : s2;
    const awayScore = c1IsHome ? s2 : s1;

    // Search all weeks for a matching game
    for (const [, week] of Object.entries(data.nfl.weeks)) {
      for (const game of week.games) {
        const gHome = (game.home.abbr || '').toUpperCase();
        const gAway = (game.away.abbr || '').toUpperCase();
        if (gHome !== homeAbbr || gAway !== awayAbbr) continue;

        const newWinner = isFinal ? (homeScore > awayScore ? homeAbbr : awayAbbr) : null;
        const newStatus = isFinal ? 'final' : 'live';

        if (
          game.score_home !== homeScore || game.score_away !== awayScore ||
          game.status !== newStatus || (isFinal && game.winner !== newWinner)
        ) {
          game.score_home = homeScore;
          game.score_away = awayScore;
          game.status     = newStatus;
          if (isFinal) game.winner = newWinner;
          changed = true;
        }
        break;
      }
    }
  }

  if (changed) {
    await saveData(data);
    broadcast('nfl_update_all', { weeks: data.nfl.weeks });
    console.log('🏈 NFL auto-scored from ESPN');
  }
}

// ── Sync picks + results from eversbracket2 (shared Supabase) ─────────────────
async function syncFromEversbracket2() {
  try {
    const data = await loadData();
    if (!data.ncaa) data.ncaa = { picksLocked: false, results: {}, picks: {} };
    let changed = false;

    // 1. Sync picks from bracket_picks table
    const pickRows = await sbFetchRaw('bracket_picks');
    if (Array.isArray(pickRows)) {
      for (const row of pickRows) {
        if (!row.user_name || row.user_name === '__lock__') continue;
        if (['PME','Phil','Reece'].includes(row.user_name) && row.picks) {
          data.ncaa.picks[row.user_name] = row.picks;
          changed = true;
        }
      }
    }

    // 2. Convert bracket_results → positional results format
    const resultRows = await sbFetchRaw('bracket_results');
    if (Array.isArray(resultRows) && resultRows.length > 0) {
      // Build cumulative winner sets per round (same logic as eversbracket2)
      const W = { R64:new Set(), R32:new Set(), S16:new Set(), E8:new Set(), F4:new Set(), CHIP:new Set() };
      for (const { game_id, winner } of resultRows) {
        if (!game_id || !winner) continue;
        const lo = game_id.toLowerCase();
        if      (lo.startsWith('chip')) ['R64','R32','S16','E8','F4','CHIP'].forEach(r => W[r].add(winner));
        else if (lo.startsWith('f4'))   ['R64','R32','S16','E8','F4'].forEach(r => W[r].add(winner));
        else if (lo.startsWith('e8'))   ['R64','R32','S16','E8'].forEach(r => W[r].add(winner));
        else if (lo.startsWith('s16'))  ['R64','R32','S16'].forEach(r => W[r].add(winner));
        else if (lo.startsWith('r32'))  ['R64','R32'].forEach(r => W[r].add(winner));
        else                            W['R64'].add(winner);
      }

      // Fuzzy set membership — handles ESPN name variants (e.g. "SMU" vs "SMU Mustangs")
      function fhas(set, bracketName) {
        if (set.has(bracketName)) return true;
        for (const w of set) { if (teamMatch(w, bracketName)) return true; }
        return false;
      }

      const nr = {};
      // R64 — each team appears in exactly one slot
      nr.R64 = {};
      for (const rgn of ['EAST','WEST','SOUTH','MIDWEST']) {
        const ro = NCAA_ROFF[rgn];
        NCAA_BRACKET[rgn].forEach((g, i) => {
          const gi = ro.R64 + i;
          if (fhas(W.R64, g.team1))      nr.R64[gi] = g.team1;
          else if (fhas(W.R64, g.team2)) nr.R64[gi] = g.team2;
        });
      }
      // R32
      nr.R32 = {};
      for (const rgn of ['EAST','WEST','SOUTH','MIDWEST']) {
        const ro = NCAA_ROFF[rgn];
        for (let i = 0; i < 4; i++) {
          const gi = ro.R32 + i;
          const t1 = nr.R64[ro.R64 + i*2], t2 = nr.R64[ro.R64 + i*2 + 1];
          if (t1 && fhas(W.R32, t1))      nr.R32[gi] = t1;
          else if (t2 && fhas(W.R32, t2)) nr.R32[gi] = t2;
        }
      }
      // S16
      nr.S16 = {};
      for (const rgn of ['EAST','WEST','SOUTH','MIDWEST']) {
        const ro = NCAA_ROFF[rgn];
        for (let i = 0; i < 2; i++) {
          const gi = ro.S16 + i;
          const t1 = nr.R32[ro.R32 + i*2], t2 = nr.R32[ro.R32 + i*2 + 1];
          if (t1 && fhas(W.S16, t1))      nr.S16[gi] = t1;
          else if (t2 && fhas(W.S16, t2)) nr.S16[gi] = t2;
        }
      }
      // E8
      nr.E8 = {};
      for (const rgn of ['EAST','WEST','SOUTH','MIDWEST']) {
        const ro = NCAA_ROFF[rgn];
        const t1 = nr.S16[ro.S16], t2 = nr.S16[ro.S16 + 1];
        if (t1 && fhas(W.E8, t1))      nr.E8[ro.E8] = t1;
        else if (t2 && fhas(W.E8, t2)) nr.E8[ro.E8] = t2;
      }
      // F4  (E8 indices: EAST=0, WEST=1, SOUTH=2, MIDWEST=3)
      nr.F4 = {};
      [[0,1],[2,3]].forEach(([a,b], fi) => {
        const t1 = nr.E8[a], t2 = nr.E8[b];
        if (t1 && fhas(W.F4, t1))      nr.F4[fi] = t1;
        else if (t2 && fhas(W.F4, t2)) nr.F4[fi] = t2;
      });
      // CHIP
      nr.CHIP = {};
      const f0 = nr.F4[0], f1 = nr.F4[1];
      if (f0 && fhas(W.CHIP, f0))      nr.CHIP[0] = f0;
      else if (f1 && fhas(W.CHIP, f1)) nr.CHIP[0] = f1;

      // Convert numeric keys to strings for consistency
      for (const rnd of NCAA_ROUNDS) {
        if (!nr[rnd]) continue;
        const strKeyed = {};
        Object.entries(nr[rnd]).forEach(([k,v]) => { strKeyed[String(k)] = v; });
        nr[rnd] = strKeyed;
      }

      data.ncaa.results = nr;
      changed = true;
    }

    if (changed) {
      memCache = data;
      await saveData(data);
      for (const user of ['PME','Phil','Reece']) {
        broadcast('ncaa_picks_update', { user, picks: (data.ncaa.picks[user] || {}) });
      }
      broadcast('ncaa_results_update', { results: data.ncaa.results });
      console.log('🔄 Synced picks+results from eversbracket2');
    }
  } catch (e) {
    console.error('syncFromEversbracket2 error:', e.message);
  }
}

// ── Start ESPN poller after boot ──────────────────────────────────────────────
const ESPN_POLL_MS = 55000; // ~55 seconds
setTimeout(async () => {
  console.log('Starting ESPN auto-score poller…');
  await syncFromEversbracket2(); // sync picks+results from eversbracket2 on boot
  await Promise.allSettled([autoScoreNCAA(), autoScoreNBA(), autoScoreNFL()]);
  setInterval(async () => {
    await syncFromEversbracket2();
    Promise.allSettled([autoScoreNCAA(), autoScoreNBA(), autoScoreNFL()]);
  }, ESPN_POLL_MS);
}, 8000); // wait 8s after boot before first poll

// ─── NCAA ROUTES ──────────────────────────────────────────────────────────────

// GET /api/ncaa/state — bracket definition + picks + results + locked flag
app.get('/api/ncaa/state', async (req, res) => {
  const data = await loadData();
  res.json({
    bracket:     NCAA_BRACKET,
    scoring:     NCAA_SCORING,
    rounds:      NCAA_ROUNDS,
    picks:       (data.ncaa && data.ncaa.picks)       || {},
    results:     (data.ncaa && data.ncaa.results)     || {},
    picksLocked: (data.ncaa && data.ncaa.picksLocked) || false,
  });
});

// POST /api/ncaa/picks/:user — save full picks object for a user
app.post('/api/ncaa/picks/:user', async (req, res) => {
  const { user } = req.params;
  const picks = req.body; // { R64:[...], R32:[...], S16:[...], E8:[...], F4:[...], CHIP:[...] }
  const data = await loadData();

  if (!data.ncaa) data.ncaa = { picksLocked: false, results: {}, picks: {} };
  if (data.ncaa.picksLocked) return res.status(403).json({ error: 'NCAA picks are locked' });
  if (!data.meta.users.includes(user)) return res.status(400).json({ error: 'Unknown user' });

  data.ncaa.picks[user] = picks;
  await saveData(data);
  broadcast('ncaa_picks_update', { user, picks });
  res.json({ ok: true });
});

// POST /api/ncaa/results — admin: set a game result { password, round, gi, winner }
app.post('/api/ncaa/results', async (req, res) => {
  const { password, round, gi, winner } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  if (!NCAA_ROUNDS.includes(round)) return res.status(400).json({ error: 'Invalid round' });

  if (!data.ncaa) data.ncaa = { picksLocked: false, results: {}, picks: {} };
  if (!data.ncaa.results[round]) data.ncaa.results[round] = {};
  if (winner) {
    data.ncaa.results[round][String(gi)] = winner;
  } else {
    delete data.ncaa.results[round][String(gi)];
  }
  await saveData(data);
  broadcast('ncaa_results_update', { results: data.ncaa.results });
  res.json({ ok: true });
});

// POST /api/admin/ncaa/lock — lock/unlock NCAA picks
app.post('/api/admin/ncaa/lock', async (req, res) => {
  const { password, locked } = req.body;
  const data = await loadData();
  if (password !== data.meta.adminPassword) return res.status(401).json({ error: 'Wrong password' });
  if (!data.ncaa) data.ncaa = { picksLocked: false, results: {}, picks: {} };
  data.ncaa.picksLocked = !!locked;
  await saveData(data);
  broadcast('ncaa_lock_update', { locked: data.ncaa.picksLocked });
  res.json({ ok: true, locked: data.ncaa.picksLocked });
});

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  const data = await loadData();
  const scores = {};

  for (const user of data.meta.users) {
    scores[user] = { total: 0, nba: 0, nfl: 0, ncaa: 0 };
    const userPicks = data.picks[user] || { nba: {}, nfl: {} };

    // NBA scoring
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

    // NFL scoring
    for (const [, week] of Object.entries(data.nfl.weeks)) {
      const pts = week.type === 'playoff' ? 3 : 1;
      for (const game of week.games) {
        if (game.winner && userPicks.nfl[game.id] === game.winner) {
          scores[user].nfl   += pts;
          scores[user].total += pts;
        }
      }
    }

    // NCAA scoring — set-based, matching eversbracket2's algorithm exactly:
    // For each round, score each pick that appears in the cumulative winner set.
    // A team that won S16 is in W.R64, W.R32, and W.S16 (cumulative), so a user
    // who picked them in all three arrays scores points for all three rounds.
    if (data.ncaa && data.ncaa.results) {
      const ncaaPicks = (data.ncaa.picks || {})[user] || {};
      const ncaaRes   = data.ncaa.results;

      // Build cumulative winner sets from positional results
      const W = {};
      NCAA_ROUNDS.forEach(r => { W[r] = new Set(); });
      for (let ri = 0; ri < NCAA_ROUNDS.length; ri++) {
        const round = NCAA_ROUNDS[ri];
        for (const winner of Object.values(ncaaRes[round] || {})) {
          if (!winner) continue;
          // Add to this round AND all earlier rounds (cumulative)
          for (let j = 0; j <= ri; j++) W[NCAA_ROUNDS[j]].add(winner);
        }
      }

      for (const round of NCAA_ROUNDS) {
        const pts = NCAA_SCORING[round];
        for (const team of (ncaaPicks[round] || [])) {
          if (team && W[round].has(team)) {
            scores[user].ncaa  += pts;
            scores[user].total += pts;
          }
        }
      }
    }
  }

  const board = Object.entries(scores)
    .map(([user, s]) => ({ user, ...s }))
    .sort((a, b) => b.total - a.total)
    .map((row, i) => ({ rank: i + 1, ...row }));

  res.json(board);
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🏀🏈🎓  Sports Hub running on port ${PORT}`);
  console.log(`    Persistence: ${SB_URL ? 'Supabase' : 'local file'}`);
  await loadData(); // warm cache
});

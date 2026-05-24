const express = require('express');
const fetch = require('node-fetch');
const app = express();

const EMAIL = 'cmjf88@gmail.com';
const PASSWORD = 'Falcons%246';

async function getSession() {
  const res = await fetch(`https://www.myfxbook.com/api/login.json?email=${EMAIL}&password=${PASSWORD}`);
  const data = await res.json();
  if (data.error) throw new Error('Login failed');
  return data.session;
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Myfxbook proxy running - all endpoints active' });
});

// All accounts - balance, equity, gain, drawdown, profit
app.get('/accounts', async (req, res) => {
  try {
    const session = await getSession();
    const response = await fetch(`https://www.myfxbook.com/api/get-my-accounts.json?session=${session}`);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

// Full closed trade history - entry, exit, pips, profit, direction, duration, lots
app.get('/history', async (req, res) => {
  try {
    const session = await getSession();
    const { id } = req.query;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    const response = await fetch(`https://www.myfxbook.com/api/get-history.json?session=${session}&id=${id}`);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

// Open trades - current positions, entry price, current price, pips floating
app.get('/open-trades', async (req, res) => {
  try {
    const session = await getSession();
    const { id } = req.query;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    const response = await fetch(`https://www.myfxbook.com/api/get-open-trades.json?session=${session}&id=${id}`);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

// Daily gain/loss breakdown - day by day performance
app.get('/daily', async (req, res) => {
  try {
    const session = await getSession();
    const { id, start, end } = req.query;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    const s = start || '2026-01-01';
    const e = end || new Date().toISOString().split('T')[0];
    const response = await fetch(`https://www.myfxbook.com/api/get-data-daily.json?session=${session}&id=${id}&start=${s}&end=${e}`);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

// Full account statistics - win rate, avg win, avg loss, expectancy, best/worst trade, avg duration
app.get('/stats', async (req, res) => {
  try {
    const session = await getSession();
    const { id } = req.query;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    const response = await fetch(`https://www.myfxbook.com/api/get-account-statistics.json?session=${session}&id=${id}`);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

// Gain chart data - equity curve over time
app.get('/gain', async (req, res) => {
  try {
    const session = await getSession();
    const { id, start, end } = req.query;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    const s = start || '2026-01-01';
    const e = end || new Date().toISOString().split('T')[0];
    const response = await fetch(`https://www.myfxbook.com/api/get-gain.json?session=${session}&id=${id}&start=${s}&end=${e}`);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

// Max drawdown details - max drawdown, date it occurred
app.get('/drawdown', async (req, res) => {
  try {
    const session = await getSession();
    const { id } = req.query;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    const response = await fetch(`https://www.myfxbook.com/api/get-account-drawdown.json?session=${session}&id=${id}`);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

// All data in one shot for a single account - combines accounts + stats + open trades
app.get('/full', async (req, res) => {
  try {
    const session = await getSession();
    const { id } = req.query;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    const [accounts, stats, openTrades, history] = await Promise.all([
      fetch(`https://www.myfxbook.com/api/get-my-accounts.json?session=${session}`).then(r => r.json()),
      fetch(`https://www.myfxbook.com/api/get-account-statistics.json?session=${session}&id=${id}`).then(r => r.json()),
      fetch(`https://www.myfxbook.com/api/get-open-trades.json?session=${session}&id=${id}`).then(r => r.json()),
      fetch(`https://www.myfxbook.com/api/get-history.json?session=${session}&id=${id}`).then(r => r.json()),
    ]);
    const account = accounts.accounts ? accounts.accounts.find(a => String(a.id) === String(id)) : null;
    res.json({ account, stats, openTrades, history });
  } catch(e) { res.json({ error: true, message: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy running on port', PORT));

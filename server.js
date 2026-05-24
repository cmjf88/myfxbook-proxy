const express = require('express');
const fetch = require('node-fetch');
const app = express();

const EMAIL = 'cmjf88@gmail.com';
const PASSWORD = 'Falcons%246';

async function getSession() {
  const res = await fetch('https://www.myfxbook.com/api/login.json?email=' + EMAIL + '&password=' + PASSWORD);
  const data = await res.json();
  if (data.error) throw new Error('Login failed');
  return data.session;
}

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', function(req, res) {
  res.json({ status: 'ok', message: 'Myfxbook proxy running' });
});

app.get('/accounts', async function(req, res) {
  try {
    var session = await getSession();
    var response = await fetch('https://www.myfxbook.com/api/get-my-accounts.json?session=' + session);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/history', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    var response = await fetch('https://www.myfxbook.com/api/get-history.json?session=' + session + '&id=' + id);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/open-trades', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    var response = await fetch('https://www.myfxbook.com/api/get-open-trades.json?session=' + session + '&id=' + id);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/daily', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    var start = req.query.start || '2026-01-01';
    var end = req.query.end || new Date().toISOString().split('T')[0];
    var response = await fetch('https://www.myfxbook.com/api/get-data-daily.json?session=' + session + '&id=' + id + '&start=' + start + '&end=' + end);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/gain', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    var start = req.query.start || '2026-01-01';
    var end = req.query.end || new Date().toISOString().split('T')[0];
    var response = await fetch('https://www.myfxbook.com/api/get-gain.json?session=' + session + '&id=' + id + '&start=' + start + '&end=' + end);
    res.json(await response.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/full', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No account id provided' });
    var start = '2026-01-01';
    var end = new Date().toISOString().split('T')[0];
    var results = await Promise.all([
      fetch('https://www.myfxbook.com/api/get-my-accounts.json?session=' + session).then(function(r) { return r.json(); }),
      fetch('https://www.myfxbook.com/api/get-open-trades.json?session=' + session + '&id=' + id).then(function(r) { return r.json(); }),
      fetch('https://www.myfxbook.com/api/get-history.json?session=' + session + '&id=' + id).then(function(r) { return r.json(); }),
      fetch('https://www.myfxbook.com/api/get-data-daily.json?session=' + session + '&id=' + id + '&start=' + start + '&end=' + end).then(function(r) { return r.json(); }),
      fetch('https://www.myfxbook.com/api/get-gain.json?session=' + session + '&id=' + id + '&start=' + start + '&end=' + end).then(function(r) { return r.json(); })
    ]);
    var account = results[0].accounts ? results[0].accounts.find(function(a) { return String(a.id) === String(id); }) : null;
    res.json({ account: account, openTrades: results[1], history: results[2], daily: results[3], gain: results[4] });
  } catch(e) { res.json({ error: true, message: e.message }); }
});

// ALL endpoint - pulls everything for all EB accounts in one shot
app.get('/all', async function(req, res) {
  try {
    var session = await getSession();
    var start = '2026-01-01';
    var end = new Date().toISOString().split('T')[0];
    var accountsRes = await fetch('https://www.myfxbook.com/api/get-my-accounts.json?session=' + session);
    var accountsData = await accountsRes.json();
    var ebAccounts = accountsData.accounts.filter(function(a) { return a.name && a.name.includes('E.B.'); });
    var fullData = await Promise.all(ebAccounts.map(async function(account) {
      var results = await Promise.all([
        fetch('https://www.myfxbook.com/api/get-open-trades.json?session=' + session + '&id=' + account.id).then(function(r) { return r.json(); }),
        fetch('https://www.myfxbook.com/api/get-history.json?session=' + session + '&id=' + account.id).then(function(r) { return r.json(); }),
        fetch('https://www.myfxbook.com/api/get-data-daily.json?session=' + session + '&id=' + account.id + '&start=' + start + '&end=' + end).then(function(r) { return r.json(); })
      ]);
      return {
        account: account,
        openTrades: results[0],
        history: results[1],
        daily: results[2]
      };
    }));
    res.json({ error: false, data: fullData });
  } catch(e) { res.json({ error: true, message: e.message }); }
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('Proxy running on port ' + PORT); });

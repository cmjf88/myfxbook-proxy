const express = require('express');
const fetch = require('node-fetch');
const app = express();

const EMAIL = 'cmjf88@gmail.com';
const PASSWORD = 'Falcons$6';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

async function getSession() {
  var email = encodeURIComponent(EMAIL);
  var password = encodeURIComponent(PASSWORD);
  var res = await fetch('https://www.myfxbook.com/api/login.json?email=' + email + '&password=' + password, { headers: HEADERS });
  var data = await res.json();
  if (data.error) throw new Error('Login failed: ' + data.message);
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
    var r = await fetch('https://www.myfxbook.com/api/get-my-accounts.json?session=' + session, { headers: HEADERS });
    res.json(await r.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/history', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No id' });
    var r = await fetch('https://www.myfxbook.com/api/get-history.json?session=' + session + '&id=' + id, { headers: HEADERS });
    res.json(await r.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/open-trades', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No id' });
    var r = await fetch('https://www.myfxbook.com/api/get-open-trades.json?session=' + session + '&id=' + id, { headers: HEADERS });
    res.json(await r.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/daily', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No id' });
    var start = req.query.start || '2026-01-01';
    var end = req.query.end || new Date().toISOString().split('T')[0];
    var r = await fetch('https://www.myfxbook.com/api/get-data-daily.json?session=' + session + '&id=' + id + '&start=' + start + '&end=' + end, { headers: HEADERS });
    res.json(await r.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/gain', async function(req, res) {
  try {
    var session = await getSession();
    var id = req.query.id;
    if (!id) return res.json({ error: true, message: 'No id' });
    var start = req.query.start || '2026-01-01';
    var end = req.query.end || new Date().toISOString().split('T')[0];
    var r = await fetch('https://www.myfxbook.com/api/get-gain.json?session=' + session + '&id=' + id + '&start=' + start + '&end=' + end, { headers: HEADERS });
    res.json(await r.json());
  } catch(e) { res.json({ error: true, message: e.message }); }
});

app.get('/all', async function(req, res) {
  try {
    var session = await getSession();
    var start = '2026-01-01';
    var end = new Date().toISOString().split('T')[0];
    var accountsRes = await fetch('https://www.myfxbook.com/api/get-my-accounts.json?session=' + session, { headers: HEADERS });
    var accountsData = await accountsRes.json();
    var ebAccounts = accountsData.accounts.filter(function(a) { return a.name && a.name.includes('E.B.'); });
    var fullData = await Promise.all(ebAccounts.map(async function(account) {
      var results = await Promise.all([
        fetch('https://www.myfxbook.com/api/get-open-trades.json?session=' + session + '&id=' + account.id, { headers: HEADERS }).then(function(r) { return r.json(); }),
        fetch('https://www.myfxbook.com/api/get-history.json?session=' + session + '&id=' + account.id, { headers: HEADERS }).then(function(r) { return r.json(); }),
        fetch('https://www.myfxbook.com/api/get-data-daily.json?session=' + session + '&id=' + account.id + '&start=' + start + '&end=' + end, { headers: HEADERS }).then(function(r) { return r.json(); })
      ]);
      return { account: account, openTrades: results[0], history: results[1], daily: results[2] };
    }));
    res.json({ error: false, data: fullData });
  } catch(e) { res.json({ error: true, message: e.message }); }
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log('Proxy running on port ' + PORT); });

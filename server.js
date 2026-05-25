const express = require('express');
const fetch = require('node-fetch');
const app = express();

const EMAIL = 'cmjf88@gmail.com';
const PASSWORD = 'Falcons%246';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.myfxbook.com/'
};

async function getSession() {
  const res = await fetch('https://www.myfxbook.com/api/login.json?email=' + EMAIL + '&password=' + PASSWORD, { headers: HEADERS });
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
    var response = await fetch('https

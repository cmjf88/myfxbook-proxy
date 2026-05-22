const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Myfxbook proxy running' });
});

app.get('/accounts', async (req, res) => {
  try {
    const session = req.query.session;
    if (!session) return res.json({ error: true, message: 'No session provided' });
    const response = await fetch(`https://www.myfxbook.com/api/get-my-accounts.json?session=${session}`);
    const data = await response.json();
    res.json(data);
  } catch(e) {
    res.json({ error: true, message: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy running on port', PORT));

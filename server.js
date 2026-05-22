const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/accounts', async (req, res) => {
  try {
    const session = req.query.session;
    const response = await fetch(`https://www.myfxbook.com/api/get-my-accounts.json?session=${session}`);
    const data = await response.json();
    res.json(data);
  } catch(e) {
    res.json({ error: true, message: e.message });
  }
});

app.listen(process.env.PORT || 3000);

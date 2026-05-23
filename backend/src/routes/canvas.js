const express = require('express');
const router = express.Router();
const { getOne, runQuery, nowISO } = require('../db');

router.get('/', (req, res) => {
  const username = req.headers['x-username'];
  
  const canvas = getOne('SELECT * FROM canvas WHERE username = ?', [username]);
  
  if (canvas) {
    res.json(canvas);
  } else {
    res.json({ username, canvasData: null });
  }
});

router.post('/', (req, res) => {
  const username = req.headers['x-username'];
  const { canvasData } = req.body;
  
  const existing = getOne('SELECT * FROM canvas WHERE username = ?', [username]);
  
  if (existing) {
    runQuery('UPDATE canvas SET canvasData = ?, updatedAt = ? WHERE username = ?', [canvasData, nowISO(), username]);
  } else {
    runQuery('INSERT INTO canvas (username, canvasData, updatedAt) VALUES (?, ?, ?)', [username, canvasData, nowISO()]);
  }
  
  const updated = getOne('SELECT * FROM canvas WHERE username = ?', [username]);
  res.json(updated);
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { getOne, runQuery, nowISO } = require('../db');

router.get('/', (req, res) => {
  const username = req.headers['x-username'];
  
  const user = getOne('SELECT id, username, pfp, bio, createdAt, updatedAt FROM users WHERE username = ?', [username]);
  
  if (!user) {
    runQuery('INSERT INTO users (username, pfp, bio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)', [username, '😊', '', nowISO(), nowISO()]);
    const newUser = getOne('SELECT id, username, pfp, bio, createdAt, updatedAt FROM users WHERE username = ?', [username]);
    return res.json(newUser);
  }
  
  res.json(user);
});

router.put('/', (req, res) => {
  const username = req.headers['x-username'];
  const { pfp, bio } = req.body;
  
  const existing = getOne('SELECT * FROM users WHERE username = ?', [username]);
  
  if (existing) {
    runQuery('UPDATE users SET pfp = ?, bio = ?, updatedAt = ? WHERE username = ?', 
      [pfp || existing.pfp, bio || existing.bio, nowISO(), username]);
  } else {
    runQuery('INSERT INTO users (username, pfp, bio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [username, pfp || '😊', bio || '', nowISO(), nowISO()]);
  }
  
  const updated = getOne('SELECT id, username, pfp, bio, createdAt, updatedAt FROM users WHERE username = ?', [username]);
  res.json(updated);
});

module.exports = router;
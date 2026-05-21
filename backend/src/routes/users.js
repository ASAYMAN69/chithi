const express = require('express');
const router = express.Router();
const { getOne, runQuery } = require('../db');

router.get('/', (req, res) => {
  const username = req.headers['x-username'];
  
  const user = getOne('SELECT id, username, pfp, bio, createdAt, updatedAt FROM users WHERE username = ?', [username]);
  
  if (!user) {
    runQuery('INSERT INTO users (username, pfp, bio, createdAt, updatedAt) VALUES (?, ?, ?, datetime("now"), datetime("now"))', [username, '😊', '']);
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
    runQuery('UPDATE users SET pfp = ?, bio = ?, updatedAt = datetime("now") WHERE username = ?', 
      [pfp || existing.pfp, bio || existing.bio, username]);
  } else {
    runQuery('INSERT INTO users (username, pfp, bio, createdAt, updatedAt) VALUES (?, ?, ?, datetime("now"), datetime("now"))',
      [username, pfp || '😊', bio || '']);
  }
  
  const updated = getOne('SELECT id, username, pfp, bio, createdAt, updatedAt FROM users WHERE username = ?', [username]);
  res.json(updated);
});

module.exports = router;
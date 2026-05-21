const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../db');

router.get('/', (req, res) => {
  const username = req.headers['x-username'];
  const music = getAll('SELECT * FROM music WHERE username = ? ORDER BY priority ASC, createdAt DESC', [username]);
  res.json(music);
});

router.post('/', (req, res) => {
  const username = req.headers['x-username'];
  const { musicPath, thumbnailPath, name, description, priority } = req.body;
  
  if (!musicPath || !name) {
    return res.status(400).json({ error: 'musicPath and name are required' });
  }
  
  runQuery('INSERT INTO music (musicPath, thumbnailPath, name, description, priority, username, createdAt) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))',
    [musicPath, thumbnailPath || '', name, description || '', priority || 0, username]);
  
  const newMusic = getOne('SELECT * FROM music WHERE id = (SELECT MAX(id) FROM music WHERE username = ?)', [username]);
  res.json(newMusic);
});

router.delete('/:id', (req, res) => {
  const username = req.headers['x-username'];
  const { id } = req.params;
  
  runQuery('DELETE FROM music WHERE id = ? AND username = ?', [id, username]);
  
  res.json({ success: true });
});

module.exports = router;
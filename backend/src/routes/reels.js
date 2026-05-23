const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery, nowISO } = require('../db');

router.get('/', (req, res) => {
  const reels = getAll('SELECT * FROM reels ORDER BY createdAt DESC');
  res.json(reels);
});

router.post('/', (req, res) => {
  const username = req.headers['x-username'];
  const { videoPath, name, description } = req.body;
  
  if (!videoPath || !name) {
    return res.status(400).json({ error: 'videoPath and name are required' });
  }
  
  runQuery('INSERT INTO reels (videoPath, name, description, username, createdAt) VALUES (?, ?, ?, ?, ?)', 
    [videoPath, name, description || '', username, nowISO()]);
  
  const newReel = getOne('SELECT * FROM reels WHERE id = (SELECT MAX(id) FROM reels)');
  res.json(newReel);
});

router.delete('/:id', (req, res) => {
  const username = req.headers['x-username'];
  const { id } = req.params;
  
  runQuery('DELETE FROM reels WHERE id = ? AND username = ?', [id, username]);
  
  res.json({ success: true });
});

module.exports = router;
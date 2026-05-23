const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getAll, getOne, runQuery, nowISO } = require('../db');

router.get('/', (req, res) => {
  const username = req.headers['x-username'];
  const youtubeSongs = getAll(
    `SELECT id, musicPath, thumbnailPath, name, description, priority, createdAt, 'youtube' as _source
     FROM music WHERE username = ? ORDER BY priority ASC, createdAt DESC`,
    [username]
  );
  const uploadSongs = getAll(
    `SELECT id, key, name, author as description, thumbnail as thumbnailPath, musicPath, username, createdAt, 'upload' as _source
     FROM music_tracks ORDER BY createdAt DESC`
  );
  res.json([...youtubeSongs, ...uploadSongs]);
});

router.post('/', (req, res) => {
  const username = req.headers['x-username'];
  const { musicPath, thumbnailPath, name, description, priority } = req.body;

  if (!musicPath || !name) {
    return res.status(400).json({ error: 'musicPath and name are required' });
  }

  runQuery(
    `INSERT INTO music (musicPath, thumbnailPath, name, description, priority, username, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [musicPath, thumbnailPath || '', name, description || '', priority || 0, username, nowISO()]
  );

  const newMusic = getOne('SELECT * FROM music WHERE id = (SELECT MAX(id) FROM music WHERE username = ?)', [username]);
  res.json(newMusic);
});

router.post('/tracks', (req, res) => {
  const username = req.headers['x-username'];
  const { key, name, author } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'key is required' });
  }

  const fileInfo = getOne('SELECT original_path FROM file_management WHERE key = ?', [key]);
  if (!fileInfo) {
    return res.status(404).json({ error: 'Uploaded file not found' });
  }

  const filename = path.basename(fileInfo.original_path);
  const musicPath = `/cdn/audio/${filename}`;
  const id = uuidv4();

  runQuery(
    `INSERT INTO music_tracks (id, key, musicPath, username, name, author, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, key, musicPath, username, name || '', author || '', nowISO()]
  );

  const newTrack = getOne('SELECT * FROM music_tracks WHERE id = ?', [id]);
  res.json(newTrack);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const existing = getOne('SELECT id FROM music_tracks WHERE id = ?', [id]);
  if (existing) {
    runQuery('DELETE FROM music_tracks WHERE id = ?', [id]);
  } else {
    runQuery('DELETE FROM music WHERE id = ?', [id]);
  }

  res.json({ success: true });
});

module.exports = router;

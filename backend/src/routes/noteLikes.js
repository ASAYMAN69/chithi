const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../db');

router.get('/:noteId', (req, res) => {
  const { noteId } = req.params;
  const likes = getAll('SELECT username FROM note_likes WHERE note_id = ?', [noteId]);
  res.json(likes);
});

router.post('/:noteId', (req, res) => {
  const username = req.headers['x-username'];
  const { noteId } = req.params;
  
  const note = getOne('SELECT * FROM notes WHERE id = ?', [noteId]);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  if (note.username === username) {
    return res.status(403).json({ error: 'Cannot like your own note' });
  }
  
  const existing = getOne('SELECT * FROM note_likes WHERE note_id = ? AND username = ?', [noteId, username]);
  if (existing) {
    return res.status(400).json({ error: 'Already liked' });
  }
  
  runQuery('INSERT INTO note_likes (note_id, username, createdAt) VALUES (?, ?, datetime("now"))', [noteId, username]);
  
  const likes = getAll('SELECT username FROM note_likes WHERE note_id = ?', [noteId]);
  res.json(likes);
});

router.delete('/:noteId', (req, res) => {
  const username = req.headers['x-username'];
  const { noteId } = req.params;
  
  runQuery('DELETE FROM note_likes WHERE note_id = ? AND username = ?', [noteId, username]);
  
  const likes = getAll('SELECT username FROM note_likes WHERE note_id = ?', [noteId]);
  res.json(likes);
});

module.exports = router;
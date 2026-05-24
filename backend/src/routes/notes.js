const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery, saveDB, nowISO } = require('../db');
const { broadcastWS } = require('../ws');

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const notes = getAll('SELECT * FROM notes WHERE isDeleted = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]);
  const total = getOne('SELECT COUNT(*) as count FROM notes WHERE isDeleted = 0');
  res.json({ notes, hasMore: offset + limit < total.count });
});

router.post('/', (req, res) => {
  const username = req.headers['x-username'];
  const { noteText, type, key } = req.body;
  
  if (!noteText) {
    return res.status(400).json({ error: 'noteText is required' });
  }
  
  runQuery('INSERT INTO notes (noteText, username, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)', [noteText, username, type || 'text', nowISO(), nowISO()]);
  
  broadcastWS({ type: 'notes_updated' });
  
  const newNote = getOne('SELECT * FROM notes WHERE id = (SELECT MAX(id) FROM notes WHERE username = ?)', [username]);
  res.json(newNote);
});

router.put('/:id', (req, res) => {
  const username = req.headers['x-username'];
  const { id } = req.params;
  const { noteText } = req.body;
  
  if (!noteText) {
    return res.status(400).json({ error: 'noteText is required' });
  }
  
  const existing = getOne('SELECT * FROM notes WHERE id = ?', [id]);
  if (!existing || existing.username !== username) {
    return res.status(403).json({ error: 'Unauthorized to edit this note' });
  }
  
  runQuery('UPDATE notes SET noteText = ?, updatedAt = ? WHERE id = ? AND username = ?', [noteText, nowISO(), id, username]);
  
  broadcastWS({ type: 'notes_updated' });
  
  const updated = getOne('SELECT * FROM notes WHERE id = ?', [id]);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const username = req.headers['x-username'];
  
  if (!username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const existing = getOne('SELECT * FROM notes WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  if (existing.username !== username) {
    return res.status(403).json({ error: 'Unauthorized to delete this note' });
  }
  
  runQuery('UPDATE notes SET isDeleted = 1, updatedAt = ? WHERE id = ? AND username = ?', [nowISO(), id, username]);
  
  broadcastWS({ type: 'notes_updated' });
  
  res.json({ success: true });
});

module.exports = router;
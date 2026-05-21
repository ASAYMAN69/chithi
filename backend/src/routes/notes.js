const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery, saveDB } = require('../db');

router.get('/', (req, res) => {
  const notes = getAll('SELECT * FROM notes WHERE isDeleted = 0 ORDER BY createdAt DESC');
  res.json(notes);
});

router.post('/', (req, res) => {
  const username = req.headers['x-username'];
  const { noteText } = req.body;
  
  if (!noteText) {
    return res.status(400).json({ error: 'noteText is required' });
  }
  
  runQuery('INSERT INTO notes (noteText, username, createdAt, updatedAt) VALUES (?, ?, datetime("now"), datetime("now"))', [noteText, username]);
  
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
  
  runQuery('UPDATE notes SET noteText = ?, updatedAt = datetime("now") WHERE id = ? AND username = ?', [noteText, id, username]);
  
  const updated = getOne('SELECT * FROM notes WHERE id = ?', [id]);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  runQuery('UPDATE notes SET isDeleted = 1, updatedAt = datetime("now") WHERE id = ?', [id]);
  
  res.json({ success: true });
});

module.exports = router;
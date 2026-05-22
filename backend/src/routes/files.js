const express = require('express');
const router = express.Router();
const { getOne } = require('../db');
const fs = require('fs');

// Fetch metadata
router.get('/:key/metadata', (req, res) => {
  const { key } = req.params;
  const username = req.headers['x-username'];
  
  const file = getOne('SELECT * FROM file_management WHERE key = ?', [key]);
  if (!file) return res.status(404).json({ error: 'File not found' });
  
  res.json({
    fileType: file.fileType,
    compressed_path: file.compressed_path
  });
});

// Download original file (any authenticated user)
router.get('/:key/download', (req, res) => {
  const { key } = req.params;
  
  const file = getOne('SELECT * FROM file_management WHERE key = ?', [key]);
  if (!file) return res.status(404).json({ error: 'File not found' });
  
  if (fs.existsSync(file.original_path)) {
    res.download(file.original_path);
  } else {
    res.status(404).json({ error: 'Original file missing' });
  }
});

module.exports = router;

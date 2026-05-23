const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { authMiddleware, loadAllowedUsers } = require('./middleware/auth');
const { initDB, closeDB } = require('./db');
const { ensureDirs, CDN_DIR } = require('./utils/paths');
const { initWS } = require('./ws');

const app = express();
const PORT = process.env.PORT || 6767;

app.use(cors());
app.use(express.json());

// CDN images: keys are unguessable UUIDs, access gated at API level
app.get('/cdn/images/:key', (req, res) => {
  const key = req.params.key.replace(/\.webp$/i, '');
  const imagePath = path.join(CDN_DIR, 'images', `${key}.webp`);
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(imagePath);
});

// Static CDN for music, videos (images handled above)
app.use('/cdn', express.static(CDN_DIR, {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (['.mp3', '.wav', '.ogg'].includes(ext)) {
      res.set('Cache-Control', 'public, max-age=86400');
    } else if (['.mp4', '.webm'].includes(ext)) {
      res.set('Cache-Control', 'public, max-age=604800');
    }
  }
}));

app.use('/api', authMiddleware);

app.use('/api/notes', require('./routes/notes'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/music', require('./routes/music'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/canvas', require('./routes/canvas'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/user', require('./routes/users'));
app.use('/api/note-likes', require('./routes/noteLikes'));
app.use('/api/files', require('./routes/files'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const startServer = async () => {
  await initDB();
  console.log('Database initialized');
  
  const server = app.listen(PORT, () => {
    console.log(`Chithi server running on port ${PORT}`);
    loadAllowedUsers();
  });
  
  initWS(server);
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  closeDB();
  process.exit(0);
});

module.exports = app;
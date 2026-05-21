const express = require('express');
const cors = require('cors');
const path = require('path');

const { authMiddleware, loadAllowedUsers } = require('./middleware/auth');
const { initDB, closeDB } = require('./db');
const { ensureDirs, CDN_DIR } = require('./utils/paths');

const app = express();
const PORT = process.env.PORT || 6767;

app.use(cors());
app.use(express.json());

app.use('/cdn', express.static(CDN_DIR, {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (['.mp3', '.wav', '.ogg'].includes(ext)) {
      res.set('Cache-Control', 'public, max-age=86400');
    } else if (['.mp4', '.webm'].includes(ext)) {
      res.set('Cache-Control', 'public, max-age=604800');
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const startServer = async () => {
  await initDB();
  console.log('Database initialized');
  
  app.listen(PORT, () => {
    console.log(`Chithi server running on port ${PORT}`);
    loadAllowedUsers();
  });
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
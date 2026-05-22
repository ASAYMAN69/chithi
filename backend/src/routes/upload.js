const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { CDN_DIR } = require('../utils/paths');

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const [type] = file.mimetype.split('/');
  if (allowedTypes.includes(type)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};

const createUploadHandler = (type, maxSize, allowedTypes) => {
  const storage = multer.diskStorage({
    destination: (req, res, cb) => {
      const username = req.headers['x-username'];
      const dir = type === 'image'
        ? path.join(CDN_DIR, 'images')
        : path.join(CDN_DIR, type + 's', username);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  });
  
  return multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: fileFilter(allowedTypes)
  });
};

const imageUpload = createUploadHandler('image', 5 * 1024 * 1024, ['image']);
const musicUpload = createUploadHandler('music', 50 * 1024 * 1024, ['audio']);
const videoUpload = createUploadHandler('video', 100 * 1024 * 1024, ['video']);

const sharp = require('sharp');
const { runQuery } = require('../db');

router.post('/image', imageUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const username = req.headers['x-username'];
  const key = uuidv4();
  const ext = path.extname(req.file.originalname);
  
  const imagesDir = path.join(CDN_DIR, 'images');
  const originalPath = path.join(imagesDir, `${key}${ext}`);
  const compressedPath = path.join(imagesDir, `${key}.webp`);
  
  // Move the multer-saved file to our canonical path
  fs.renameSync(req.file.path, originalPath);
  
  // Compress to .webp
  try {
    await sharp(originalPath)
      .webp({ quality: 80 })
      .toFile(compressedPath);
  } catch (err) {
    console.error('Compression failed:', err.message);
  }
  
  // Record in DB
  runQuery('INSERT INTO file_management (key, fileType, compressed_path, original_path, username) VALUES (?, ?, ?, ?, ?)', 
    [key, 'image', compressedPath, originalPath, username]);
  
  res.json({
    success: true,
    key: key
  });
});

router.post('/music', musicUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const username = req.headers['x-username'];
  const relativePath = `/music/${username}/${req.file.filename}`;
  
  res.json({
    success: true,
    url: relativePath,
    filename: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype
  });
});

router.post('/video', videoUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const username = req.headers['x-username'];
  const relativePath = `/videos/${username}/${req.file.filename}`;
  
  res.json({
    success: true,
    url: relativePath,
    filename: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype
  });
});

module.exports = router;
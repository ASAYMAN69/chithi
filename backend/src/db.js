const initSqlJs = require('sql.js');
const fs = require('fs');
const { getDBPath } = require('./utils/paths');

const dbPath = getDBPath();
let db;

/**
 * Single Source of Truth for the Database Schema.
 * Add new columns here, and they will be automatically added to the database on startup.
 */
const SCHEMA = {
  users: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    username: 'TEXT UNIQUE NOT NULL',
    pfp: 'TEXT DEFAULT "😊"',
    bio: 'TEXT DEFAULT ""',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  },
  notes: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    noteText: 'TEXT NOT NULL',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    isDeleted: 'INTEGER DEFAULT 0',
    username: 'TEXT NOT NULL',
    type: 'TEXT DEFAULT "text"'
  },
  reels: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    videoPath: 'TEXT NOT NULL',
    name: 'TEXT NOT NULL',
    description: 'TEXT DEFAULT ""',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    username: 'TEXT NOT NULL'
  },
  music: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    musicPath: 'TEXT NOT NULL',
    thumbnailPath: 'TEXT DEFAULT ""',
    name: 'TEXT NOT NULL',
    description: 'TEXT DEFAULT ""',
    priority: 'INTEGER DEFAULT 0',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    username: 'TEXT NOT NULL'
  },
  weather: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    username: 'TEXT NOT NULL',
    latitude: 'REAL NOT NULL',
    longitude: 'REAL NOT NULL',
    weather_condition: 'TEXT',
    cachedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  },
  canvas: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    username: 'TEXT NOT NULL',
    canvasData: 'TEXT',
    updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  },
  note_likes: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    note_id: 'INTEGER NOT NULL',
    username: 'TEXT NOT NULL',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  },
  file_management: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    key: 'TEXT UNIQUE NOT NULL',
    fileType: 'TEXT',
    compressed_path: 'TEXT',
    original_path: 'TEXT',
    username: 'TEXT'
  },
  music_tracks: {
    id: 'TEXT PRIMARY KEY',
    key: 'TEXT NOT NULL',
    musicPath: 'TEXT NOT NULL DEFAULT ""',
    username: 'TEXT NOT NULL',
    name: 'TEXT DEFAULT ""',
    author: 'TEXT DEFAULT ""',
    thumbnail: 'TEXT DEFAULT ""',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  }
};

const initDB = async () => {
  const SQL = await initSqlJs();
  
  let fileBuffer = null;
  if (fs.existsSync(dbPath)) {
    fileBuffer = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(fileBuffer);
  
  // Create base tables if they don't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, noteText TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS reels (id INTEGER PRIMARY KEY AUTOINCREMENT, videoPath TEXT NOT NULL, name TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS music (id INTEGER PRIMARY KEY AUTOINCREMENT, musicPath TEXT NOT NULL, name TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS weather (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS canvas (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS note_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, note_id INTEGER NOT NULL, username TEXT NOT NULL, UNIQUE(note_id, username))`);
  db.run(`CREATE TABLE IF NOT EXISTS file_management (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS music_tracks (id TEXT PRIMARY KEY, key TEXT NOT NULL, username TEXT NOT NULL)`);
  
  // Automatically sync the rest of the columns
  syncSchema();
  
  saveDB();
  console.log('Database schema initialized and synced');
  
  return db;
};

/**
 * Automatically adds missing columns to existing tables based on the SCHEMA definition.
 */
const syncSchema = () => {
  for (const [tableName, columns] of Object.entries(SCHEMA)) {
    // Get existing columns for this table
    const existingColumns = getAll(`PRAGMA table_info(${tableName})`).map(c => c.name);
    
    // Check for missing columns
    for (const [colName, colType] of Object.entries(columns)) {
      if (!existingColumns.includes(colName)) {
        try {
          db.run(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colType}`);
          console.log(`Auto-Migrated: Added missing column '${colName}' to '${tableName}'`);
        } catch (err) {
          console.error(`Failed to add column ${colName} to ${tableName}:`, err.message);
        }
      }
    }
  }
};

const saveDB = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

const getDB = () => db;

const closeDB = () => {
  if (db) {
    saveDB();
    db.close();
  }
};

const runQuery = (sql, params = []) => {
  db.run(sql, params);
  saveDB();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
};

const getOne = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
};

const getAll = (sql, params = []) => {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};

module.exports = { initDB, getDB, saveDB, closeDB, runQuery, getOne, getAll };

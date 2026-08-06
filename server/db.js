const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, 'data.db');

function init() {
  const exists = fs.existsSync(DB_FILE);
  const db = new sqlite3.Database(DB_FILE);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS files (
      filename TEXT PRIMARY KEY,
      patientId TEXT,
      originalname TEXT,
      path TEXT,
      mimetype TEXT,
      size INTEGER,
      timestamp TEXT
    )`);
  });

  return db;
}

function saveFileMeta(db, meta) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO files (filename, patientId, originalname, path, mimetype, size, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(meta.filename, meta.patientId, meta.originalname, meta.path, meta.mimetype, meta.size, meta.timestamp, function (err) {
      stmt.finalize();
      if (err) return reject(err);
      resolve(true);
    });
  });
}

function getFileMeta(db, filename) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM files WHERE filename = ?`, [filename], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function listFilesForPatient(db, patientId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM files WHERE patientId = ?`, [patientId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

module.exports = { init, saveFileMeta, getFileMeta, listFilesForPatient };

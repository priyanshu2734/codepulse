const sqlite3 = require('sqlite3').verbose();
const config = require('../config/secrets');

// Shared database connection
const db = new sqlite3.Database(config.db.path, (err) => {
  if (err) console.error('DB connection error:', err.message);
});

module.exports = db;

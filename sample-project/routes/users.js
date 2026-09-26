const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /users/search?username=...
// ISSUE (SQL Injection): Raw user input concatenated directly into SQL query string
router.get('/search', (req, res) => {
  const { username } = req.query;
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /users/:id
// ISSUE (Unhandled async error): No try/catch around async DB call; promise rejection is unhandled
router.get('/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json(user);
});

async function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /users/search?username=...
// FIXED (SEC-002): Parameterized query replaces string concatenation.
// The username value is bound as a parameter — it cannot alter the SQL structure.
router.get('/search', (req, res) => {
  const { username } = req.query;
  const query = 'SELECT * FROM users WHERE username = ?';
  db.all(query, [username], (err, rows) => {
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

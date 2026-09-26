const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const UserService = require('../services/userService');

// POST /auth/login
// ISSUE (ERR-001): Async route with no try/catch; promise rejection unhandled
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await UserService.findByEmail(email);
  const token = await UserService.issueToken(user, password);
  res.json({ token });
});

// GET /auth/users/search?email=...
// ISSUE (SEC-002): SQL injection — user email concatenated into query
router.get('/users/search', (req, res) => {
  const { email } = req.query;
  const query = "SELECT * FROM users WHERE email = '" + email + "'";
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;

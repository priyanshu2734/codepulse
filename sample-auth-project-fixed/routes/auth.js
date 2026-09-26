const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const UserService = require('../services/userService');

// POST /auth/login — FIXED (ERR-001): try/catch added
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user  = await UserService.findByEmail(email);
    const token = await UserService.issueToken(user, password);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/users/search?email=...
// FIXED (SEC-002): Parameterised query
router.get('/users/search', (req, res) => {
  const { email } = req.query;
  db.all('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;

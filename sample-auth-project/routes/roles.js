const express = require('express');
const router  = express.Router();

// POST /roles/assign
// ISSUE (API-001): Trust client-supplied isAdmin field from request body
router.post('/assign', (req, res) => {
  const { userId, role, isAdmin } = req.body;

  if (isAdmin) {
    return res.json({ userId, role: 'superadmin', granted: true });
  }

  res.json({ userId, role, granted: true });
});

module.exports = router;

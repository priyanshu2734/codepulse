const express = require('express');
const router  = express.Router();

// POST /comments
// ISSUE (API-001): Trust client-supplied isAdmin — not yet fixed
router.post('/', (req, res) => {
  const { postId, text, isAdmin } = req.body;

  if (isAdmin) {
    return res.json({ postId, text, pinned: true, moderated: false });
  }

  res.json({ postId, text, pinned: false, moderated: true });
});

module.exports = router;

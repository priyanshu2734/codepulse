const express = require('express');
const router  = express.Router();

// POST /comments
// ISSUE (API-001): Trust client-supplied isAdmin for comment moderation
router.post('/', (req, res) => {
  const { postId, text, isAdmin } = req.body;

  if (isAdmin) {
    // Admins can post pinned comments that bypass moderation
    return res.json({ postId, text, pinned: true, moderated: false });
  }

  res.json({ postId, text, pinned: false, moderated: true });
});

module.exports = router;

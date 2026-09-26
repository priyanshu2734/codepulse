const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const PostService = require('../services/postService');

// GET /posts/search?tag=...
// FIXED (SEC-002): Uses parameterised query to prevent SQL injection
router.get('/search', (req, res) => {
  const { tag } = req.query;
  db.all('SELECT * FROM posts WHERE tag = ?', [tag], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /posts/summary
// FIXED (ERR-001): try/catch around async operations
router.get('/summary', async (req, res) => {
  try {
    const posts = await PostService.getAllPosts();
    const results = [];

    // ISSUE (PERF-001): N+1 query still present — not yet fixed in this iteration
    for (const post of posts) {
      const author = await PostService.getAuthorForPost(post.authorId);
      results.push({ ...post, author });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /posts — FIXED (LOG-001): console.log removed
router.post('/', async (req, res) => {
  try {
    const post = await PostService.createPost(req.body);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

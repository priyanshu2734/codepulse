const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const PostService = require('../services/postService');

// GET /posts/search?tag=...
// ISSUE (SEC-002): SQL injection via string concatenation
router.get('/search', (req, res) => {
  const { tag } = req.query;
  const query = "SELECT * FROM posts WHERE tag = '" + tag + "'";
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /posts/summary
// ISSUE (ERR-001): Async route handler without try/catch
router.get('/summary', async (req, res) => {
  const posts = await PostService.getAllPosts();
  const results = [];

  // ISSUE (PERF-001): N+1 — separate DB query per post inside a loop
  for (const post of posts) {
    const author = await PostService.getAuthorForPost(post.authorId);
    results.push({ ...post, author });
  }
  res.json(results);
});

// POST /posts
// ISSUE (LOG-001): debug console.log left in production handler
router.post('/', async (req, res) => {
  console.log('Creating new post:', req.body);
  const post = await PostService.createPost(req.body);
  res.json(post);
});

module.exports = router;

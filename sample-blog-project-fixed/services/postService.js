const db = require('../db/connection');

// FIXED (LOGIC-001): Strict equality for post status check
function isPublished(post) {
  return post.status === 'published';
}

// FIXED (SYNC-001): No synchronous file reads; config loaded asynchronously at startup

async function getAllPosts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM posts', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function getAuthorForPost(authorId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name FROM authors WHERE id = ?', [authorId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function createPost(data) {
  return { ...data, id: Date.now(), status: 'draft' };
}

module.exports = { isPublished, getAllPosts, getAuthorForPost, createPost };

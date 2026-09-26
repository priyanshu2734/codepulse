const fs = require('fs');
const db = require('../db/connection');

// ISSUE (SYNC-001): Reads post template synchronously — blocks event loop
const postTemplate = fs.readFileSync('./config/post-template.txt', 'utf8');

// ISSUE (LOGIC-001): Loose equality comparison for post status check
function isPublished(post) {
  return post.status == 'published';
}

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

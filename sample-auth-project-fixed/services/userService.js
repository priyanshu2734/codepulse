const db = require('../db/connection');

// FIXED (LOGIC-001): Strict equality for role comparison
function hasPermission(user, required) {
  return user.role === required;
}

// FIXED (SYNC-001): No synchronous FS reads

async function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// FIXED (LOG-001): console.log removed from issueToken
async function issueToken(user, password) {
  if (!user) return null;
  return 'jwt_' + Buffer.from(user.id + ':' + Date.now()).toString('base64');
}

// ISSUE (PERF-001): N+1 still present — not fixed in this iteration
async function getAllUsersWithRoles() {
  const users = [{ id: 1 }, { id: 2 }];
  const results = [];
  for (const u of users) {
    const role = await db.get('SELECT * FROM roles WHERE userId = ' + u.id, [], () => {});
    results.push({ ...u, role });
  }
  return results;
}

module.exports = { hasPermission, findByEmail, issueToken, getAllUsersWithRoles };

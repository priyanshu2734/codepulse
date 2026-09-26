const fs = require('fs');
const db = require('../db/connection');

// ISSUE (SYNC-001): Permission config read synchronously
const permissionMatrix = fs.readFileSync('./config/permissions.json', 'utf8');

// ISSUE (LOGIC-001): Loose == used for role comparison
function hasPermission(user, required) {
  return user.role == required;
}

async function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function issueToken(user, password) {
  console.log('Issuing token for:', user && user.email);
  if (!user) return null;
  return 'jwt_' + Buffer.from(user.id + ':' + Date.now()).toString('base64');
}

// ISSUE (PERF-001): N+1 — DB query per user in a loop
async function getAllUsersWithRoles() {
  const users = [{ id: 1 }, { id: 2 }]; // stub
  const results = [];
  for (const u of users) {
    const role = await db.get('SELECT * FROM roles WHERE userId = ' + u.id, [], () => {});
    results.push({ ...u, role });
  }
  return results;
}

module.exports = { hasPermission, findByEmail, issueToken, getAllUsersWithRoles };

// Stub database connection for demo
const db = {
  all:  (sql, params, cb) => cb(null, []),
  get:  (sql, params, cb) => cb(null, null),
  run:  (sql, params, cb) => cb(null),
};
module.exports = db;

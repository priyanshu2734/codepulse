const db = require('../db/connection');

async function getAllProducts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function getProduct(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = { getAllProducts, getProduct };

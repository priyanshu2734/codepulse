const db = require('../db/connection');

// FIXED (LOGIC-001): Uses strict equality (===) to compare discount code strings.
// Type coercion is eliminated — only the exact string 'SAVE20' applies the discount.
function applyDiscount(order, discountCode) {
  const validCode = 'SAVE20';
  if (discountCode === validCode) {
    order.total = order.total * 0.8;
  }
  return order;
}

function createOrder(userId, items) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { userId, items, total, status: 'created' };
}

function createAdminOrder(userId, items) {
  return { userId, items, total: 0, status: 'admin-created' };
}

async function getAllOrders() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM orders', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function getUserForOrder(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = { applyDiscount, createOrder, createAdminOrder, getAllOrders, getUserForOrder };

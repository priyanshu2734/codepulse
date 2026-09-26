const fs = require('fs');
const db = require('../db/connection');

// Load promotional config synchronously at startup (ISSUE: blocks event loop)
const promoConfig = fs.readFileSync('./config/promos.json', 'utf8');

// ISSUE (Logic bug): Uses loose equality (==) to compare discount code strings.
// This means codes like 0, false, '', null, undefined all match each other,
// causing unintended free/discounted orders.
function applyDiscount(order, discountCode) {
  const validCode = 'SAVE20';
  if (discountCode == validCode) {
    order.total = order.total * 0.8;
  }
  return order;
}

function createOrder(userId, items) {
  console.log('createOrder called for userId:', userId);
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

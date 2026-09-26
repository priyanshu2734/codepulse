const express = require('express');
const router = express.Router();
const OrderService = require('../services/orderService');

// POST /orders
// ISSUE (Privilege escalation / API trust): The route accepts `isAdmin` from the
// request body and uses it for access control without any server-side validation.
router.post('/', (req, res) => {
  const { userId, items, isAdmin } = req.body;

  if (isAdmin) {
    // Admins can create orders with a 100% discount
    return res.json(OrderService.createAdminOrder(userId, items));
  }

  res.json(OrderService.createOrder(userId, items));
});

// GET /orders/summary
// ISSUE (Performance — N+1 query): Fetches all orders then runs a separate
// DB query inside a loop for each order instead of a single JOIN.
router.get('/summary', async (req, res) => {
  const orders = await OrderService.getAllOrders();
  const results = [];

  for (const order of orders) {
    const user = await OrderService.getUserForOrder(order.userId); // DB query in loop
    results.push({ ...order, user });
  }

  res.json(results);
});

module.exports = router;

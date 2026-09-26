const express = require('express');
const router = express.Router();
const ProductService = require('../services/productService');

// GET /products
router.get('/', async (req, res) => {
  const products = await ProductService.getAllProducts();
  res.json(products);
});

// GET /products/:id
router.get('/:id', async (req, res) => {
  const product = await ProductService.getProduct(req.params.id);
  res.json(product || { error: 'Not found' });
});

module.exports = router;

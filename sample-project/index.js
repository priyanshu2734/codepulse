const express = require('express');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');

const app = express();
app.use(express.json());

app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
app.use('/products', productRoutes);

app.listen(4000, () => console.log('Sample app running on port 4000'));

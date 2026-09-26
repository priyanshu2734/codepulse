const express = require('express');
const app     = express();

app.use(express.json());
app.use('/auth',  require('./routes/auth'));
app.use('/roles', require('./routes/roles'));

app.listen(3003, () => console.log('Auth Service (fixed) on 3003'));
module.exports = app;

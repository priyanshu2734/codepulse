const express = require('express');
const app     = express();

app.use(express.json());
app.use('/posts',    require('./routes/posts'));
app.use('/comments', require('./routes/comments'));

app.listen(3002, () => console.log('Blog API on 3002'));
module.exports = app;

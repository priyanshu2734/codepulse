const express = require('express');
const cors = require('cors');
const scanRouter = require('./routes/scan');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', scanRouter);

app.listen(PORT, () => {
  console.log(`CodePulse server running on http://localhost:${PORT}`);
});

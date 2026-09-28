const express = require('express');
const cors = require('cors');
const path = require('path');
const scanRouter = require('./routes/scan');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', scanRouter);

// Serve the built React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Send index.html for any non-API route so React Router works
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`CodePulse server running on http://localhost:${PORT}`);
});

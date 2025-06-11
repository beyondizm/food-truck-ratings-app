const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

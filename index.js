const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('This is the backend server for QUEST 2026');
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
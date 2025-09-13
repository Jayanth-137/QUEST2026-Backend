const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes.js');
// const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', authRoutes);


// error handler
// app.use(errorHandler);

module.exports = app;

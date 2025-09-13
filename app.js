const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes.js');
const adminRoutes = require('./routes/adminroutes.js');
const userRoutes = require('./routes/userRoutes.js'); 
// const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes); // Uncomment and define userRoutes if needed

// error handler
// app.use(errorHandler);

module.exports = app;

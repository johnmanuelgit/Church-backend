const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

const adminRoutes = require('./routes/adminRoutes');
const memberRoutes = require('./routes/memberRoutes');
const taxRoutes = require('./routes/taxRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const initAdmin = require('./utils/initAdmin');
const session = require('express-session');
const xmastaxRoutes = require('./routes/xmastaxRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Routes
app.get('/', (req, res) => res.send('API is working'));
app.use('/api/admin', adminRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/in', incomeRoutes);
app.use('/api/out', expenseRoutes);
app.use('/api/xmas-tax', xmastaxRoutes);


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    // Init default admin
    initAdmin();

    // Start server after DB connection
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;

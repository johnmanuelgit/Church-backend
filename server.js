const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
const memberRoutes = require('./routes/memberRoutes');
const taxRoutes = require('./routes/taxRoutes');
const initAdmin = require('./utils/initAdmin');
const path = require('path');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(console.error);

// Init default admin
initAdmin();

// Routes
app.get('/', (req, res) => res.send('API is working'));
app.use('/api/admin', adminRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/tax', taxRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

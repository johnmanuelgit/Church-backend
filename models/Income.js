const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  donorName: String,
  amount: Number,
  donationType: String,
  date: String,
  year: Number
});

module.exports = mongoose.model('Income', incomeSchema);

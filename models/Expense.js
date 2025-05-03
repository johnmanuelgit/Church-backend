const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  reason: String,
  amount: Number,
  responsiblePerson: String,
  billBy: String,
  date: String,
  year: Number,
  billImage: String // filename of the uploaded image
});

module.exports = mongoose.model('Expense', expenseSchema);

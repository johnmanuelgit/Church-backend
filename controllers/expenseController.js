const Expense = require('../models/Expense');

exports.getAllExpenses = async (req, res) => {
  const expenses = await Expense.find();
  res.json(expenses);
};

exports.createExpense = async (req, res) => {
  const { reason, amount, responsiblePerson, billBy, date, year } = req.body;
  const billImage = req.file ? req.file.filename : '';

  const newExpense = new Expense({ reason, amount, responsiblePerson, billBy, date, year, billImage });
  await newExpense.save();

  res.json({ message: 'Expense saved successfully!' });
};

const Income = require('../models/Income');

exports.getAllIncomes = async (req, res) => {
  const incomes = await Income.find();
  res.json(incomes);
};

exports.createIncome = async (req, res) => {
  const newIncome = new Income(req.body);
  await newIncome.save();
  res.json({ message: 'Income saved successfully!' });
};

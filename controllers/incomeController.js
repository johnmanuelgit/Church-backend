const Income = require('../models/Income');

exports.getAllIncomes = async (req, res) => {
  try {
    let query = {};
    
    // Filter by year if provided
    if (req.query.year) {
      query.year = parseInt(req.query.year);
    }
    
    // Filter by donation type if provided
    if (req.query.donationType) {
      query.donationType = req.query.donationType;
    }
    
    const incomes = await Income.find(query).sort({ date: -1 });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createIncome = async (req, res) => {
  try {
    const newIncome = new Income(req.body);
    await newIncome.save();
    res.status(201).json({ message: 'Income saved successfully!', income: newIncome });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getIncomeById = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const updatedIncome = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedIncome) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.json({ message: 'Income updated successfully!', income: updatedIncome });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const deletedIncome = await Income.findByIdAndDelete(req.params.id);
    
    if (!deletedIncome) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.json({ message: 'Income deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchIncomes = async (req, res) => {
  try {
    const searchTerm = req.query.term;
    let query = {};
    
    // Add search regex for donor name
    if (searchTerm) {
      query.donorName = { $regex: searchTerm, $options: 'i' };
    }
    
    // Add year filter if provided
    if (req.query.year) {
      query.year = parseInt(req.query.year);
    }
    
    const incomes = await Income.find(query).sort({ date: -1 });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
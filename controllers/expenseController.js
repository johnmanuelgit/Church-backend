const Expense = require('../models/Expense');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('billImage');

exports.getAllExpenses = async (req, res) => {
  try {
    let query = {};
    if (req.query.year) {
      query.year = parseInt(req.query.year);
    }
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      year: parseInt(req.body.year)
    };

    if (req.file) {
      expenseData.billImage = `/uploads/${req.file.filename}`;
    }

    const newExpense = new Expense(expenseData);
    await newExpense.save();

    res.status(201).json({ message: 'Expense saved successfully!', expense: newExpense });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      year: parseInt(req.body.year)
    };

    if (req.file) {
      const oldExpense = await Expense.findById(req.params.id);
      if (oldExpense && oldExpense.billImage) {
        const oldImagePath = path.join(__dirname, '../public', oldExpense.billImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      expenseData.billImage = `/uploads/${req.file.filename}`;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, expenseData, { new: true, runValidators: true });
    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense updated successfully!', expense: updatedExpense });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.billImage) {
      const imagePath = path.join(__dirname, '../public', expense.billImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchExpenses = async (req, res) => {
  try {
    const searchTerm = req.query.term;
    let query = {};

    if (searchTerm) {
      query.$or = [
        { reason: { $regex: searchTerm, $options: 'i' } },
        { responsiblePerson: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    if (req.query.year) {
      query.year = parseInt(req.query.year);
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

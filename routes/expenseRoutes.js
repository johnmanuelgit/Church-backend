const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.get('/expenses', expenseController.getAllExpenses);
router.post('/expenses', expenseController.upload, expenseController.createExpense);
router.get('/expenses/search', expenseController.searchExpenses);
router.get('/expenses/:id', expenseController.getExpenseById);
router.put('/expenses/:id', expenseController.upload, expenseController.updateExpense);
router.delete('/expenses/:id', expenseController.deleteExpense);

module.exports = router;

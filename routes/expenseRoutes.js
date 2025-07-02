const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');


router.get('/expenses', expenseController.getAllExpenses);
router.get('/expenses/search', expenseController.searchExpenses);

router.post('/expenses',  expenseController.createExpense);
router.get('/expenses/:id', expenseController.getExpenseById);
router.put('/expenses/:id', expenseController.updateExpense);
router.delete('/expenses/:id', expenseController.deleteExpense);

module.exports = router;

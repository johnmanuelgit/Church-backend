const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');



router.get('/incomes', incomeController.getAllIncomes);
router.post('/incomes', incomeController.createIncome);
router.get('/incomes/search', incomeController.searchIncomes);
router.get('/incomes/:id', incomeController.getIncomeById);
router.put('/incomes/:id', incomeController.updateIncome);
router.delete('/incomes/:id', incomeController.deleteIncome);


module.exports = router;

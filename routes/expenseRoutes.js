const express = require('express');
const router = express.Router();
const multer = require('multer');
const expenseController = require('../controllers/expenseController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.get('/', expenseController.getAllExpenses);
router.post('/', upload.single('billImage'), expenseController.createExpense);

module.exports = router;

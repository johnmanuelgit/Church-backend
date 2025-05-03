const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');



router.put('/paid', taxController.markAsPaid);
router.put('/unpaid', taxController.markAsUnpaid);
router.get('/all', taxController.getAllTaxRecords);
router.get('/summary', taxController.getTaxSummary);




module.exports = router;

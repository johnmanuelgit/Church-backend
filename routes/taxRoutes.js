const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');

router.put('/paid', taxController.markAsPaid);
router.put('/unpaid', taxController.markAsUnpaid);
router.put('/update-amount', taxController.updateTaxAmount); // New route
router.get('/all', taxController.getAllTaxRecords);
router.get('/member/:memberId', taxController.getMemberTaxRecords); // New route
router.get('/summary', taxController.getTaxSummary);

module.exports = router;


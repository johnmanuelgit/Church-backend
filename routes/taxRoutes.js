const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');

// Tax payment status
router.put('/paid', taxController.markTaxPaid);
router.put('/unpaid', taxController.markTaxUnpaid);

// Tax amount management
router.put('/update-amount', taxController.updateTaxAmount);

// Tax configuration
router.put('/config/:year', taxController.updateTaxConfig);

// Tax data retrieval
router.get('/member/:memberId', taxController.getMemberTaxRecords);
router.get('/all', taxController.getAllTaxRecords);
router.get('/summary', taxController.getTaxSummary);

module.exports = router;
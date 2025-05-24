const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');

// Tax Rate Management
router.get('/rates/:year', taxController.getTaxRates);
router.put('/rates/:year', taxController.updateTaxRates);

// Tax Payment Management
router.post('/generate/:year', taxController.generateTaxPayments);

// Tax Summary Routes
router.get('/summary', taxController.getTaxSummary);
router.get('/summary/all-years', taxController.getAllYearsSummary); // Missing route

// Tax Details Routes
router.get('/details', taxController.getMemberTaxDetails);
router.get('/details/all-years', taxController.getAllYearsMemberDetails); // Missing route

// Payment Update
router.put('/payment/:paymentId', taxController.updatePaymentStatus);

// Export Routes
router.get('/export', taxController.exportTaxReport);
router.get('/export/all-years', taxController.exportAllYearsReport); // Missing route

// Utility Routes
router.get('/family-heads', taxController.getFamilyHeads);
router.get('/years', taxController.getAvailableYears);

module.exports = router;
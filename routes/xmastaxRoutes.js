const express = require('express');
const router = express.Router();
const taxController = require('../controllers/xmastaxController');

// Tax Rate Management
router.get('/rates/:year', taxController.getTaxRates);
router.put('/rates/:year', taxController.updateTaxRates);

// Tax Payment Management
router.post('/generate/:year', taxController.generateTaxPayments);

// Tax Summary Routes
router.get('/summary', taxController.getTaxSummary);
router.get('/summary/all-years', taxController.getAllYearsSummary);
// Tax Details Routes
router.get('/details', taxController.getMemberTaxDetails);
router.get('/details/all-years', taxController.getAllYearsMemberDetails);

// Member Data Routes
router.get('/members', taxController.getAllMembers); // New route for all members
router.get('/payment/:memberId', taxController.getMemberPaymentForYear); // New route for member payments

// Payment Update
router.put('/payment/:paymentId', taxController.updatePaymentStatus);

// Export Routes
router.get('/export', taxController.exportTaxReport);
router.get('/export/all-years', taxController.exportAllYearsReport);

// Utility Routes
router.get('/family-heads', taxController.getFamilyHeads);
router.get('/years', taxController.getAvailableYears);

module.exports = router;
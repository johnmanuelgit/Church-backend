const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// All routes are public
router.get('/', memberController.getAllMembers);
router.get('/heads', memberController.getFamilyHeads);
router.get('/family/:headId', memberController.getFamilyMembers);
router.get('/:id', memberController.getMemberById);
router.post('/', memberController.createMember);
router.put('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);

module.exports = router;
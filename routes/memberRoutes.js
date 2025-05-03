const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

router.get('/', memberController.getAll);
router.post('/', memberController.create);
router.put('/:id', memberController.update);
router.delete('/:id', memberController.remove);

module.exports = router;

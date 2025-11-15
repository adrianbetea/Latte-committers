const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');

// GET all fines
router.get('/', fineController.getAllFines);

// GET fine by ID
router.get('/:id', fineController.getFineById);

// POST create new fine
router.post('/', fineController.createFine);

// PUT update fine
router.put('/:id', fineController.updateFine);

// DELETE fine
router.delete('/:id', fineController.deleteFine);

module.exports = router;

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// GET resolved incidents with user info (with optional user name filter)
router.get('/resolved-incidents', adminController.getResolvedIncidents);

// GET all users (for search suggestions)
router.get('/users', adminController.getAllUsers);

// PUT update user
router.put('/users/:id', adminController.updateUser);

// DELETE user
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;

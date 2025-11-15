const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// GET list of users (history)
router.get('/users-history', adminController.getUsersHistory);

// GET activity for a user
router.get('/users/:id/activity', adminController.getUserActivity);

// Optional: create action (internal)
router.post('/actions', adminController.createAction);

module.exports = router;

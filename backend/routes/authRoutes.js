const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST login
router.post('/login', authController.login);

// POST logout
router.post('/logout', authController.logout);

// GET check authentication
router.get('/check', authController.checkAuth);

// POST register (optional - for creating admin accounts)
router.post('/register', authController.register);

module.exports = router;

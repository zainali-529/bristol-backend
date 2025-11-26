const express = require('express');
const { body } = require('express-validator');
const { 
  adminLogin, 
  getAdminProfile, 
  adminLogout 
} = require('../controllers/adminAuthController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/admin/auth/login
// @desc    Admin login with static credentials
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], adminLogin);

// @route   GET /api/admin/auth/profile
// @desc    Get admin profile
// @access  Private (Admin only)
router.get('/profile', auth, getAdminProfile);

// @route   POST /api/admin/auth/logout
// @desc    Admin logout
// @access  Private (Admin only)
router.post('/logout', auth, adminLogout);

module.exports = router;
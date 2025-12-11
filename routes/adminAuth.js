const express = require('express');
const { body } = require('express-validator');
const { 
  adminLogin, 
  getAdminProfile, 
  adminLogout,
  forgotPassword,
  resetPassword,
  updateProfile,
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

// @route   POST /api/admin/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], forgotPassword);

// @route   POST /api/admin/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', [
  body('token').isString().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], resetPassword);

// @route   GET /api/admin/auth/profile
// @desc    Get admin profile
// @access  Private (Admin only)
router.get('/profile', auth, getAdminProfile);

// @route   PATCH /api/admin/auth/profile
// @desc    Update admin profile (name and/or password)
// @access  Private (Admin only)
router.patch('/profile', auth, [
  body('name').optional().isString().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('currentPassword').optional().isString(),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
], updateProfile);

// @route   POST /api/admin/auth/logout
// @desc    Admin logout
// @access  Private (Admin only)
router.post('/logout', auth, adminLogout);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  updateContact,
  deleteContact,
  getContactStats
} = require('../controllers/contactController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ======================
// PUBLIC ROUTES (User Site)
// ======================

// @route   POST /api/contacts
// @desc    Create new contact (Public - User Site)
// @access  Public
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters'),
  body('service')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service must be between 2 and 100 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
], createContact);

// ======================
// ADMIN ROUTES (Admin Site)
// ======================

// @route   GET /api/contacts/admin/stats
// @desc    Get contact statistics
// @access  Private (Admin)
router.get('/admin/stats', auth, getContactStats);

// @route   GET /api/contacts/admin
// @desc    Get all contacts with pagination and filtering
// @access  Private (Admin)
router.get('/admin', auth, getAllContacts);

// @route   GET /api/contacts/admin/:id
// @desc    Get single contact by ID
// @access  Private (Admin)
router.get('/admin/:id', auth, getContactById);

// @route   PUT /api/contacts/admin/:id
// @desc    Update contact (status and/or notes)
// @access  Private (Admin)
router.put('/admin/:id', auth, [
  body('status')
    .optional()
    .isIn(['new', 'read', 'resolved'])
    .withMessage('Status must be: new, read, or resolved'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
], updateContact);

// @route   PUT /api/contacts/admin/:id/status
// @desc    Update contact status only
// @access  Private (Admin)
router.put('/admin/:id/status', auth, [
  body('status')
    .isIn(['new', 'read', 'resolved'])
    .withMessage('Status must be: new, read, or resolved')
], updateContactStatus);

// @route   DELETE /api/contacts/admin/:id
// @desc    Delete contact
// @access  Private (Admin)
router.delete('/admin/:id', auth, deleteContact);

module.exports = router;
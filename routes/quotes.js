const express = require('express');
const { body } = require('express-validator');
const {
  createQuote,
  getAllQuotes,
  getQuoteById,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats
} = require('../controllers/quoteController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ======================
// PUBLIC ROUTES (User Site)
// ======================

// @route   POST /api/quotes
// @desc    Create new quote request (Public - User Site)
// @access  Public
router.post('/', [
  // Business Information
  body('businessType')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Business type is required and must not exceed 100 characters'),
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Business name must be between 2 and 200 characters'),
  body('postcode')
    .trim()
    .isLength({ min: 5, max: 10 })
    .matches(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i)
    .withMessage('Please provide a valid UK postcode'),
  body('numberOfSites')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Number of sites is required'),
  
  // Energy Usage
  body('electricityUsage')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Electricity usage is required'),
  body('gasUsage')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Gas usage is required'),
  body('currentElectricityCost')
    .optional()
    .trim(),
  body('currentGasCost')
    .optional()
    .trim(),
  
  // Current Supplier
  body('currentElectricitySupplier')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Electricity supplier cannot exceed 100 characters'),
  body('currentGasSupplier')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Gas supplier cannot exceed 100 characters'),
  body('contractEndDate')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Contract end date is required'),
  body('greenEnergyPreference')
    .trim()
    .isIn(['yes', 'consider', 'no'])
    .withMessage('Green energy preference must be: yes, consider, or no'),
  
  // Contact Details
  body('contactName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters'),
  body('preferredContactMethod')
    .trim()
    .isIn(['email', 'phone', 'either'])
    .withMessage('Preferred contact method must be: email, phone, or either'),
  body('additionalNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Additional notes cannot exceed 2000 characters')
], createQuote);

// ======================
// ADMIN ROUTES (Admin Site)
// ======================

// @route   GET /api/quotes/admin/stats
// @desc    Get quote statistics
// @access  Private (Admin)
router.get('/admin/stats', auth, getQuoteStats);

// @route   GET /api/quotes/admin
// @desc    Get all quotes with pagination and filtering
// @access  Private (Admin)
router.get('/admin', auth, getAllQuotes);

// @route   GET /api/quotes/admin/:id
// @desc    Get single quote by ID
// @access  Private (Admin)
router.get('/admin/:id', auth, getQuoteById);

// @route   PUT /api/quotes/admin/:id
// @desc    Update quote (status, quoteValue, adminNotes, etc.)
// @access  Private (Admin)
router.put('/admin/:id', auth, [
  body('status')
    .optional()
    .isIn(['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'closed'])
    .withMessage('Status must be: new, reviewing, quoted, accepted, rejected, or closed'),
  body('quoteValue')
    .optional()
    .isNumeric()
    .withMessage('Quote value must be a number'),
  body('quoteCurrency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Quote currency must be 3 characters (e.g., GBP)'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Admin notes cannot exceed 5000 characters')
], updateQuote);

// @route   PUT /api/quotes/admin/:id/status
// @desc    Update quote status only
// @access  Private (Admin)
router.put('/admin/:id/status', auth, [
  body('status')
    .isIn(['new', 'reviewing', 'quoted', 'accepted', 'rejected', 'closed'])
    .withMessage('Status must be: new, reviewing, quoted, accepted, rejected, or closed')
], updateQuoteStatus);

// @route   DELETE /api/quotes/admin/:id
// @desc    Delete quote
// @access  Private (Admin)
router.delete('/admin/:id', auth, deleteQuote);

module.exports = router;


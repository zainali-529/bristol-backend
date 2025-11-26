const express = require('express');
const { body, param } = require('express-validator');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getTrustCards,
  getAdminTrustCards,
  updateTrustCards,
  updateSingleCard,
  updateStatus
} = require('../controllers/whyTrustUsController');

const router = express.Router();

// Validation middleware
const validateTrustCards = [
  body('cards')
    .isArray({ min: 3, max: 3 })
    .withMessage('Exactly 3 cards are required'),
  
  body('cards.*.icon')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon is required and must be between 1-50 characters'),
  
  body('cards.*.title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be between 1-100 characters'),
  
  body('cards.*.description')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Description is required and must be between 1-300 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const validateSingleCard = [
  param('order')
    .isInt({ min: 1, max: 3 })
    .withMessage('Order must be 1, 2, or 3'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon must be between 1-50 characters'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1-100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Description must be between 1-300 characters')
];

const validateStatus = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Public Routes
// Get active trust cards for landing page
router.get('/', getTrustCards);

// Admin Routes (Protected)
// Get trust cards for admin
router.get('/admin', protect, admin, getAdminTrustCards);

// Update all trust cards
router.put('/admin', 
  protect, 
  admin, 
  validateTrustCards, 
  updateTrustCards
);

// Update single card by order (1, 2, or 3)
router.patch('/admin/card/:order', 
  protect, 
  admin, 
  validateSingleCard, 
  updateSingleCard
);

// Update status (active/inactive)
router.patch('/admin/status', 
  protect, 
  admin, 
  validateStatus, 
  updateStatus
);

module.exports = router;


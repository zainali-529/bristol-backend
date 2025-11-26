const express = require('express');
const { body, param, query } = require('express-validator');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getFAQs,
  getCategories,
  getAdminFAQs,
  getAdminFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  updateFAQStatus,
  updateFAQOrder,
  getFAQStats
} = require('../controllers/faqController');

const router = express.Router();

// Validation middleware
const validateFAQ = [
  body('question')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Question is required and must be between 1-500 characters'),
  
  body('answer')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Answer is required and must be between 1-2000 characters'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateFAQUpdate = [
  body('question')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Question must be between 1-500 characters'),
  
  body('answer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Answer must be between 1-2000 characters'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid FAQ ID')
];

const validateStatus = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

const validateOrder = [
  body('displayOrder')
    .isInt({ min: 0 })
    .withMessage('displayOrder must be a non-negative integer')
];

const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must not be empty'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Category must not be empty'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either "active" or "inactive"')
];

// Public Routes
// Get all active FAQs (optionally filtered by category)
router.get('/', validateQuery, getFAQs);

// Get all FAQ categories
router.get('/categories', getCategories);

// Admin Routes (Protected)
// Get FAQ statistics
router.get('/admin/stats', protect, admin, getFAQStats);

// Get all FAQs for admin (with pagination and filters)
router.get('/admin', protect, admin, validateQuery, getAdminFAQs);

// Get single FAQ by ID for admin
router.get('/admin/:id', protect, admin, validateId, getAdminFAQById);

// Create new FAQ
router.post('/admin', 
  protect, 
  admin, 
  validateFAQ, 
  createFAQ
);

// Update FAQ
router.put('/admin/:id', 
  protect, 
  admin, 
  validateId,
  validateFAQUpdate, 
  updateFAQ
);

// Update FAQ status (active/inactive)
router.patch('/admin/:id/status', 
  protect, 
  admin, 
  validateId,
  validateStatus, 
  updateFAQStatus
);

// Update FAQ display order
router.patch('/admin/:id/order', 
  protect, 
  admin, 
  validateId,
  validateOrder, 
  updateFAQOrder
);

// Delete FAQ
router.delete('/admin/:id', 
  protect, 
  admin, 
  validateId, 
  deleteFAQ
);

module.exports = router;


const express = require('express');
const { body, param } = require('express-validator');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getTestimonials,
  getAdminTestimonials,
  getAdminTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateTestimonialStatus,
  updateTestimonialOrder,
  getTestimonialStats
} = require('../controllers/testimonialController');

const router = express.Router();

// Validation middleware
const validateTestimonial = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1-100 characters'),
  
  body('position')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Position is required and must be between 1-100 characters'),
  
  body('company')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company is required and must be between 1-100 characters'),
  
  body('testimonial')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Testimonial is required and must be between 1-1000 characters'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const validateOrder = [
  param('id')
    .isMongoId()
    .withMessage('Invalid testimonial ID'),
  
  body('displayOrder')
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid testimonial ID'),
  
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Public Routes
// Get all active testimonials
router.get('/', getTestimonials);

// Admin Routes (Protected)
// Get all testimonials for admin
router.get('/admin', protect, admin, getAdminTestimonials);

// Get testimonial statistics
router.get('/admin/stats', protect, admin, getTestimonialStats);

// Get single testimonial by ID
router.get('/admin/:id', 
  protect, 
  admin, 
  [param('id').isMongoId().withMessage('Invalid testimonial ID')],
  getAdminTestimonialById
);

// Create new testimonial
router.post('/admin',
  protect,
  admin,
  validateTestimonial,
  createTestimonial
);

// Update testimonial
router.put('/admin/:id',
  protect,
  admin,
  [param('id').isMongoId().withMessage('Invalid testimonial ID')],
  validateTestimonial,
  updateTestimonial
);

// Delete testimonial
router.delete('/admin/:id',
  protect,
  admin,
  [param('id').isMongoId().withMessage('Invalid testimonial ID')],
  deleteTestimonial
);

// Update testimonial status
router.patch('/admin/:id/status',
  protect,
  admin,
  validateStatus,
  updateTestimonialStatus
);

// Update testimonial display order
router.patch('/admin/:id/order',
  protect,
  admin,
  validateOrder,
  updateTestimonialOrder
);

module.exports = router;


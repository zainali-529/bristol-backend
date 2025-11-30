const express = require('express');
const { body, param, query } = require('express-validator');
const { upload } = require('../config/cloudinary');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getIndustries,
  getAdminIndustries,
  getAdminIndustryById,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  updateIndustryStatus,
  updateIndustryOrder
} = require('../controllers/industryController');

const router = express.Router();

// Validation middleware
const validateIndustry = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be between 1-100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and must be between 1-500 characters'),
  
  body('savings')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Savings is required and must be between 1-20 characters'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('sectionTitle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Section title must not exceed 200 characters'),
  
  body('sectionDescription')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Section description must not exceed 1000 characters'),
  
  body('imageAlt')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Image alt text must not exceed 100 characters')
];

const validateOrder = [
  param('id')
    .isMongoId()
    .withMessage('Invalid industry ID'),
  
  body('displayOrder')
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid industry ID'),
  
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Public Routes
// Get all active industries
router.get('/', getIndustries);

// Admin Routes (Protected)
// Get all industries for admin
router.get('/admin', protect, admin, getAdminIndustries);

// Get single industry by ID
router.get('/admin/:id', 
  protect, 
  admin, 
  [param('id').isMongoId().withMessage('Invalid industry ID')],
  getAdminIndustryById
);

// Create new industry
router.post('/admin',
  protect,
  admin,
  upload.single('image'),
  validateIndustry,
  createIndustry
);

// Update industry
router.put('/admin/:id',
  protect,
  admin,
  upload.single('image'),
  [param('id').isMongoId().withMessage('Invalid industry ID')],
  validateIndustry,
  updateIndustry
);

// Delete industry
router.delete('/admin/:id',
  protect,
  admin,
  [param('id').isMongoId().withMessage('Invalid industry ID')],
  deleteIndustry
);

// Update industry status
router.patch('/admin/:id/status',
  protect,
  admin,
  validateStatus,
  updateIndustryStatus
);

// Update industry display order
router.patch('/admin/:id/order',
  protect,
  admin,
  validateOrder,
  updateIndustryOrder
);

module.exports = router;


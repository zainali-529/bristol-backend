const express = require('express');
const { body, param, query } = require('express-validator');
const { upload } = require('../config/cloudinary');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getServices,
  getServiceBySlug,
  getAdminServices,
  getAdminServiceById,
  createService,
  updateService,
  deleteService,
  updateServiceStatus,
  updateServiceOrder,
  getServiceStats
} = require('../controllers/serviceController');

const router = express.Router();

// Validation middleware
const validateService = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be between 1-100 characters'),
  
  body('cardDescription')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Card description is required and must be between 1-200 characters'),
  
  body('cardIcon')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Card icon is required and must be between 1-50 characters'),
  
  body('aboutService')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('About service is required and must be between 1-2000 characters'),
  
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title must not exceed 60 characters'),
  
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description must not exceed 160 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateServiceUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1-100 characters'),
  
  body('cardDescription')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Card description must be between 1-200 characters'),
  
  body('cardIcon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Card icon must be between 1-50 characters'),
  
  body('aboutService')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('About service must be between 1-2000 characters'),
  
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title must not exceed 60 characters'),
  
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description must not exceed 160 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateSlug = [
  param('slug')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid service ID')
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
    .custom((value) => {
      if (value === '' || value === undefined || value === null) {
        return true; // Allow empty values
      }
      return value.trim().length >= 1 && value.trim().length <= 100;
    })
    .withMessage('Search query must be between 1-100 characters'),
  
  query('status')
    .optional()
    .custom((value) => {
      if (value === '' || value === undefined || value === null) {
        return true; // Allow empty values
      }
      return ['active', 'inactive'].includes(value);
    })
    .withMessage('Status must be either "active" or "inactive"'),
  
  query('featured')
    .optional()
    .custom((value) => {
      if (value === '' || value === undefined || value === null) {
        return true; // Allow empty values
      }
      return ['true', 'false'].includes(value);
    })
    .withMessage('Featured must be "true" or "false"')
];

// Configure multer for service images
const serviceImageUpload = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'secondaryImages', maxCount: 2 }
]);

// Admin Routes (Protected) - MUST COME BEFORE PUBLIC SLUG ROUTE
// Get service statistics
router.get('/admin/stats', protect, admin, getServiceStats);

// Get all services for admin (with pagination and filters)
router.get('/admin', protect, admin, validateQuery, getAdminServices);

// Get single service by ID for admin
router.get('/admin/:id', protect, admin, validateId, getAdminServiceById);

// Create new service
router.post('/admin', 
  protect, 
  admin, 
  serviceImageUpload,
  validateService, 
  createService
);

// Update service
router.put('/admin/:id', 
  protect, 
  admin, 
  validateId,
  serviceImageUpload,
  validateServiceUpdate, 
  updateService
);

// Update service status (active/inactive)
router.patch('/admin/:id/status', 
  protect, 
  admin, 
  validateId,
  validateStatus, 
  updateServiceStatus
);

// Update service display order
router.patch('/admin/:id/order', 
  protect, 
  admin, 
  validateId,
  validateOrder, 
  updateServiceOrder
);

// Delete service
router.delete('/admin/:id', 
  protect, 
  admin, 
  validateId, 
  deleteService
);

// Public Routes
// Get all active services (for landing page cards)
router.get('/', validateQuery, getServices);

// Get single service by slug (for detail page) - MUST COME AFTER ADMIN ROUTES
router.get('/:slug', validateSlug, getServiceBySlug);

module.exports = router;
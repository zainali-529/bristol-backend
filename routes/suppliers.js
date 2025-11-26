const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getActiveSuppliers,
  getSupplierBySlug,
  getSupplierStats,
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  updateSupplierStatus,
  updateSupplierOrder
} = require('../controllers/supplierController');

const router = express.Router();

// Cloudinary storage configuration for supplier images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bristol-utilities/suppliers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 300, crop: 'fill', quality: 'auto' }
    ],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Validation middleware
const validateSupplierFields = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1-100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and must be between 1-500 characters'),
  
  body('websiteUrl')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Website URL is required')
    .isURL({ protocols: ['http', 'https'], require_protocol: false })
    .withMessage('Please provide a valid website URL'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
  
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title cannot exceed 60 characters'),
  
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters')
];

const validateSupplierSlug = [
  param('slug')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Supplier slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid slug format')
];

const validateSupplierId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid supplier ID format')
];

const validateSupplierStatus = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive is required and must be a boolean value')
];

const validateSupplierOrder = [
  body('displayOrder')
    .isInt({ min: 0 })
    .withMessage('Display order is required and must be a non-negative integer')
];

const validateSupplierQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .custom((value) => {
      if (value === '' || value === undefined || value === null) {
        return true; // Allow empty values
      }
      return ['active', 'inactive'].includes(value);
    })
    .withMessage('Status must be either "active" or "inactive"'),
  
  query('search')
    .optional()
    .custom((value) => {
      if (value === '' || value === undefined || value === null) {
        return true; // Allow empty values
      }
      return value.trim().length >= 1 && value.trim().length <= 100;
    })
    .withMessage('Search query must be between 1-100 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt', 'displayOrder'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be "asc" or "desc"')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Public Routes
// GET /api/suppliers - Get all active suppliers
router.get('/', getActiveSuppliers);

// Admin Routes (Must come before /:slug route)
// GET /api/suppliers/admin/stats - Get supplier statistics
router.get('/admin/stats', protect, admin, getSupplierStats);

// GET /api/suppliers/admin - Get all suppliers with pagination and filters
router.get('/admin', protect, admin, validateSupplierQuery, handleValidationErrors, getAllSuppliers);

// GET /api/suppliers/:slug - Get supplier by slug (Must come after admin routes)
router.get('/:slug', validateSupplierSlug, handleValidationErrors, getSupplierBySlug);

// GET /api/suppliers/admin/:id - Get supplier by ID
router.get('/admin/:id', protect, admin, validateSupplierId, handleValidationErrors, getSupplierById);

// POST /api/suppliers/admin - Create new supplier
router.post('/admin', 
  protect, 
  admin, 
  upload.single('image'),
  validateSupplierFields,
  handleValidationErrors,
  createSupplier
);

// PUT /api/suppliers/admin/:id - Update supplier
router.put('/admin/:id', 
  protect, 
  admin, 
  validateSupplierId,
  upload.single('image'),
  validateSupplierFields,
  handleValidationErrors,
  updateSupplier
);

// DELETE /api/suppliers/admin/:id - Delete supplier
router.delete('/admin/:id', 
  protect, 
  admin, 
  validateSupplierId, 
  handleValidationErrors, 
  deleteSupplier
);

// PATCH /api/suppliers/admin/:id/status - Update supplier status
router.patch('/admin/:id/status', 
  protect, 
  admin, 
  validateSupplierId,
  validateSupplierStatus,
  handleValidationErrors,
  updateSupplierStatus
);

// PATCH /api/suppliers/admin/:id/order - Update supplier display order
router.patch('/admin/:id/order', 
  protect, 
  admin, 
  validateSupplierId,
  validateSupplierOrder,
  handleValidationErrors,
  updateSupplierOrder
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed'
    });
  }
  
  next(error);
});

module.exports = router;
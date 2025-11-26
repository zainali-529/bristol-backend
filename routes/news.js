const express = require('express');
const { body, param, query } = require('express-validator');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getNews,
  getNewsBySlug,
  getCategories,
  getTags,
  getAdminNews,
  getAdminNewsById,
  createNews,
  updateNews,
  deleteNews,
  updateNewsStatus,
  updateNewsActive,
  updateNewsOrder,
  getNewsStats
} = require('../controllers/newsController');

const router = express.Router();

// Cloudinary storage configuration for news images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bristol-utilities/news',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'fill', quality: 'auto:best' }
    ]
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP files are allowed.'), false);
    }
  }
});

// Validation middleware
const validateNews = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1-200 characters'),
  
  body('cardDescription')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Card description is required and must be between 1-300 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content is required and must be between 1-10000 characters'),
  
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must be between 1-50 characters'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',').map(t => t.trim()).filter(t => t);
        return tags.length <= 10;
      }
      if (Array.isArray(value)) {
        return value.length <= 10;
      }
      return true;
    })
    .withMessage('Maximum 10 tags allowed'),
  
  body('author.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Author name cannot exceed 100 characters'),
  
  body('author.email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Author email must be a valid email address'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  body('publishDate')
    .optional()
    .isISO8601()
    .withMessage('Publish date must be a valid ISO 8601 date'),
  
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
  
  body('isBreaking')
    .optional()
    .isBoolean()
    .withMessage('isBreaking must be a boolean'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateNewsUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1-200 characters'),
  
  body('cardDescription')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Card description must be between 1-300 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1-10000 characters'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1-50 characters'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',').map(t => t.trim()).filter(t => t);
        return tags.length <= 10;
      }
      if (Array.isArray(value)) {
        return value.length <= 10;
      }
      return true;
    })
    .withMessage('Maximum 10 tags allowed'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  body('publishDate')
    .optional()
    .isISO8601()
    .withMessage('Publish date must be a valid ISO 8601 date'),
  
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
  
  body('isBreaking')
    .optional()
    .isBoolean()
    .withMessage('isBreaking must be a boolean'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid news ID')
];

const validateSlug = [
  param('slug')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Slug is required')
];

const validateStatus = [
  body('status')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived')
];

const validateActive = [
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
  
  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Per page must be between 1-100'),
  
  query('search')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return value.length >= 1;
    })
    .withMessage('Search query must not be empty'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  query('category')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return value.length >= 1;
    })
    .withMessage('Category must not be empty'),
  
  query('featured')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Featured must be true or false'),
  
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false')
];

// ======================
// PUBLIC ROUTES (User Site)
// ======================

// ======================
// ADMIN ROUTES (Must be before /:slug route)
// ======================

// @route   GET /api/news/admin/stats
// @desc    Get news statistics
// @access  Private (Admin)
router.get('/admin/stats', protect, admin, getNewsStats);

// @route   GET /api/news/admin
// @desc    Get all news for admin (with pagination and filters)
// @access  Private (Admin)
router.get('/admin', protect, admin, validateQuery, getAdminNews);

// @route   GET /api/news/admin/:id
// @desc    Get single news by ID for admin
// @access  Private (Admin)
router.get('/admin/:id', protect, admin, validateId, getAdminNewsById);

// @route   POST /api/news/admin
// @desc    Create new news article
// @access  Private (Admin)
router.post('/admin', 
  protect, 
  admin, 
  upload.fields([
    { name: 'cardImage', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
  ]),
  validateNews, 
  createNews
);

// @route   PUT /api/news/admin/:id
// @desc    Update news article
// @access  Private (Admin)
router.put('/admin/:id', 
  protect, 
  admin, 
  validateId,
  upload.fields([
    { name: 'cardImage', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
  ]),
  validateNewsUpdate, 
  updateNews
);

// @route   PATCH /api/news/admin/:id/status
// @desc    Update news status (draft, published, archived)
// @access  Private (Admin)
router.patch('/admin/:id/status', 
  protect, 
  admin, 
  validateId,
  validateStatus, 
  updateNewsStatus
);

// @route   PATCH /api/news/admin/:id/active
// @desc    Update news active status
// @access  Private (Admin)
router.patch('/admin/:id/active', 
  protect, 
  admin, 
  validateId,
  validateActive, 
  updateNewsActive
);

// @route   PATCH /api/news/admin/:id/order
// @desc    Update news display order
// @access  Private (Admin)
router.patch('/admin/:id/order', 
  protect, 
  admin, 
  validateId,
  validateOrder, 
  updateNewsOrder
);

// @route   DELETE /api/news/admin/:id
// @desc    Delete news article
// @access  Private (Admin)
router.delete('/admin/:id', 
  protect, 
  admin, 
  validateId, 
  deleteNews
);

// ======================
// PUBLIC ROUTES (User Site)
// ======================

// @route   GET /api/news
// @desc    Get all published news (cards)
// @access  Public
router.get('/', validateQuery, getNews);

// @route   GET /api/news/categories
// @desc    Get all news categories
// @access  Public
router.get('/categories', getCategories);

// @route   GET /api/news/tags
// @desc    Get popular tags
// @access  Public
router.get('/tags', getTags);

// @route   GET /api/news/:slug
// @desc    Get single news article by slug (detail page)
// @access  Public
// NOTE: This must be LAST to avoid matching /admin routes
router.get('/:slug', validateSlug, getNewsBySlug);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
});

module.exports = router;


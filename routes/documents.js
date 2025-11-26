const express = require('express');
const { body, param, query } = require('express-validator');
const { documentUpload } = require('../config/cloudinaryDocuments');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getDocumentStats,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  uploadNewVersion,
  deleteDocumentById,
  downloadDocument,
  getDocumentCategories,
  getDocumentFileTypes
} = require('../controllers/documentController');

const router = express.Router();

// Validation middleware
const validateDocument = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1-200 characters'),
  
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('category')
    .isIn(['contracts', 'quotes', 'invoices', 'reports', 'policies', 'certificates', 'legal', 'marketing', 'other'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional({ nullable: true })
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',').map(t => t.trim()).filter(t => t);
        return tags.length <= 20; // Max 20 tags
      }
      return Array.isArray(value) && value.length <= 20;
    })
    .withMessage('Maximum 20 tags allowed'),
  
  body('accessLevel')
    .optional()
    .isIn(['private', 'internal', 'public'])
    .withMessage('Invalid access level'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  
  body('expiresAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Expires at must be a valid date')
];

const validateDocumentUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1-200 characters'),
  
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['contracts', 'quotes', 'invoices', 'reports', 'policies', 'certificates', 'legal', 'marketing', 'other'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional({ nullable: true })
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',').map(t => t.trim()).filter(t => t);
        return tags.length <= 20;
      }
      return Array.isArray(value) && value.length <= 20;
    })
    .withMessage('Maximum 20 tags allowed'),
  
  body('accessLevel')
    .optional()
    .isIn(['private', 'internal', 'public'])
    .withMessage('Invalid access level'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
  
  body('expiresAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Expires at must be a valid date')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID')
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
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return value.length >= 1;
    })
    .withMessage('Search query must not be empty'),
  
  query('status')
    .optional()
    .isIn(['active', 'archived'])
    .withMessage('Status must be active or archived'),
  
  query('category')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return value.length >= 1;
    })
    .withMessage('Category must not be empty'),
  
  query('fileType')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true;
      return value.length >= 1;
    })
    .withMessage('File type must not be empty'),
  
  query('tag')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true;
      return value.length >= 1;
    })
    .withMessage('Tag must not be empty'),
  
  query('accessLevel')
    .optional()
    .isIn(['private', 'internal', 'public'])
    .withMessage('Access level must be private, internal, or public'),
  
  query('sortBy')
    .optional()
    .isIn(['title', 'uploadedAt', 'fileSize', 'displayOrder', 'lastAccessedAt'])
    .withMessage('Sort by must be title, uploadedAt, fileSize, displayOrder, or lastAccessedAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// ======================
// ADMIN ROUTES
// ======================

// @route   GET /api/documents/admin/stats
// @desc    Get document statistics
// @access  Private (Admin)
router.get('/admin/stats', protect, admin, getDocumentStats);

// @route   GET /api/documents/admin/categories
// @desc    Get document categories
// @access  Private (Admin)
router.get('/admin/categories', protect, admin, getDocumentCategories);

// @route   GET /api/documents/admin/file-types
// @desc    Get document file types
// @access  Private (Admin)
router.get('/admin/file-types', protect, admin, getDocumentFileTypes);

// @route   GET /api/documents/admin
// @desc    Get all documents (with pagination and filters)
// @access  Private (Admin)
router.get('/admin', protect, admin, validateQuery, getAllDocuments);

// @route   GET /api/documents/admin/:id
// @desc    Get single document by ID
// @access  Private (Admin)
router.get('/admin/:id', protect, admin, validateId, getDocumentById);

// @route   POST /api/documents/admin
// @desc    Create new document
// @access  Private (Admin)
router.post('/admin', 
  protect, 
  admin, 
  (req, res, next) => {
    documentUpload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        });
      }
      next();
    });
  },
  validateDocument, 
  createDocument
);

// @route   PUT /api/documents/admin/:id
// @desc    Update document metadata
// @access  Private (Admin)
router.put('/admin/:id', 
  protect, 
  admin, 
  validateId,
  validateDocumentUpdate, 
  updateDocument
);

// @route   POST /api/documents/admin/:id/version
// @desc    Upload new version of document
// @access  Private (Admin)
router.post('/admin/:id/version', 
  protect, 
  admin, 
  validateId,
  documentUpload.single('file'),
  uploadNewVersion
);

// @route   DELETE /api/documents/admin/:id
// @desc    Delete document
// @access  Private (Admin)
router.delete('/admin/:id', 
  protect, 
  admin, 
  validateId, 
  deleteDocumentById
);

// @route   GET /api/documents/admin/:id/download
// @desc    Download document
// @access  Private (Admin)
router.get('/admin/:id/download', 
  protect, 
  admin, 
  validateId, 
  downloadDocument
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
});

module.exports = router;


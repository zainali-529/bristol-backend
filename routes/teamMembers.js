const express = require('express');
const { body, param, query } = require('express-validator');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getActiveTeamMembers,
  getTeamMemberById,
  getTeamMemberStats,
  getAllTeamMembers,
  getTeamMemberByIdAdmin,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  updateTeamMemberStatus,
  updateTeamMemberOrder
} = require('../controllers/teamMemberController');

const router = express.Router();

// Cloudinary storage configuration for team member images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bristol-utilities/team-members',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 600, height: 800, crop: 'fill', quality: 'auto:best' }
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
const validateTeamMember = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1-100 characters'),
  
  body('position')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Position is required and must be between 1-100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and must be between 1-500 characters'),
  
  body('linkedin')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlRegex.test(value);
    })
    .withMessage('Please provide a valid LinkedIn URL'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('twitter')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlRegex.test(value);
    })
    .withMessage('Please provide a valid Twitter URL'),
  
  body('website')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlRegex.test(value);
    })
    .withMessage('Please provide a valid website URL'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateTeamMemberUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1-100 characters'),
  
  body('position')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Position must be between 1-100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1-500 characters'),
  
  body('linkedin')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlRegex.test(value);
    })
    .withMessage('Please provide a valid LinkedIn URL'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('twitter')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlRegex.test(value);
    })
    .withMessage('Please provide a valid Twitter URL'),
  
  body('website')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlRegex.test(value);
    })
    .withMessage('Please provide a valid website URL'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid team member ID')
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
    .custom((value) => {
      if (value === '') return true; // Allow empty string
      return value.length >= 1;
    })
    .withMessage('Search query must not be empty'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
];

// ======================
// ADMIN ROUTES (Must be before /:id route)
// ======================

// @route   GET /api/team-members/admin/stats
// @desc    Get team members statistics
// @access  Private (Admin)
router.get('/admin/stats', protect, admin, getTeamMemberStats);

// @route   GET /api/team-members/admin
// @desc    Get all team members for admin (with pagination and filters)
// @access  Private (Admin)
router.get('/admin', protect, admin, validateQuery, getAllTeamMembers);

// @route   GET /api/team-members/admin/:id
// @desc    Get single team member by ID for admin
// @access  Private (Admin)
router.get('/admin/:id', protect, admin, validateId, getTeamMemberByIdAdmin);

// @route   POST /api/team-members/admin
// @desc    Create new team member
// @access  Private (Admin)
router.post('/admin', 
  protect, 
  admin, 
  upload.single('image'),
  validateTeamMember, 
  createTeamMember
);

// @route   PUT /api/team-members/admin/:id
// @desc    Update team member
// @access  Private (Admin)
router.put('/admin/:id', 
  protect, 
  admin, 
  validateId,
  upload.single('image'),
  validateTeamMemberUpdate, 
  updateTeamMember
);

// @route   PATCH /api/team-members/admin/:id/status
// @desc    Update team member active status
// @access  Private (Admin)
router.patch('/admin/:id/status', 
  protect, 
  admin, 
  validateId,
  validateStatus, 
  updateTeamMemberStatus
);

// @route   PATCH /api/team-members/admin/:id/order
// @desc    Update team member display order
// @access  Private (Admin)
router.patch('/admin/:id/order', 
  protect, 
  admin, 
  validateId,
  validateOrder, 
  updateTeamMemberOrder
);

// @route   DELETE /api/team-members/admin/:id
// @desc    Delete team member
// @access  Private (Admin)
router.delete('/admin/:id', 
  protect, 
  admin, 
  validateId, 
  deleteTeamMember
);

// ======================
// PUBLIC ROUTES (User Site)
// ======================

// @route   GET /api/team-members
// @desc    Get all active team members
// @access  Public
router.get('/', getActiveTeamMembers);

// @route   GET /api/team-members/:id
// @desc    Get single team member by ID
// @access  Public
// NOTE: This must be LAST to avoid matching /admin routes
router.get('/:id', validateId, getTeamMemberById);

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


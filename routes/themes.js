const express = require('express');
const { body, param, query } = require('express-validator');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { auth } = require('../middleware/auth');
const {
  getActiveTheme,
  getAllThemes,
  getThemeById,
  createOrUpdateTheme,
  updatePrimaryColor,
  deleteTheme,
  resetTheme,
  uploadLogo,
  uploadFavicon,
  deleteLogo,
  deleteFavicon
} = require('../controllers/themeController');
const { isValidHexColor } = require('../utils/colorUtils');

const router = express.Router();

// Helper function to get file extension
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Cloudinary storage configuration for theme assets
// Use dynamic params to handle SVG files differently
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const fileExtension = getFileExtension(file.originalname);
    const isSVG = fileExtension === 'svg';
    
    // For SVG files, use raw resource type (preserves vector format)
    // For other images, use image resource type with transformations
    if (isSVG) {
      return {
        folder: 'bristol-utilities/theme',
        resource_type: 'raw', // SVG as raw to preserve vector format
        public_id: `logo-${Date.now()}-${file.originalname.replace(/\s/g, '_').split('.')[0]}`,
      };
    }
    
    // For regular images, use image resource type with transformations
    return {
      folder: 'bristol-utilities/theme',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'ico'],
      transformation: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto:best' }
      ],
      public_id: `logo-${Date.now()}-${file.originalname.replace(/\s/g, '_').split('.')[0]}`,
    };
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const fileExtension = getFileExtension(file.originalname);
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp', 
      'image/svg+xml',
      'image/svg', // Some browsers use this
      'text/xml', // Some browsers might send SVG as text/xml
      'application/xml', // Fallback
      'image/x-icon',
      'image/vnd.microsoft.icon'
    ];
    
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'ico'];
    
    // Check MIME type
    if (allowedTypes.includes(file.mimetype)) {
      console.log(`✅ File accepted by MIME type: ${file.mimetype}`);
      cb(null, true);
    } 
    // Fallback: check file extension (especially for SVG which can have various MIME types)
    else if (allowedExtensions.includes(fileExtension)) {
      console.log(`✅ File accepted by extension: ${fileExtension}`);
      cb(null, true);
    } 
    else {
      console.log(`❌ File rejected: MIME type ${file.mimetype} and extension ${fileExtension} not allowed`);
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, SVG, and ICO files are allowed.'), false);
    }
  }
});

// ======================
// VALIDATION MIDDLEWARE
// ======================

const validateHexColor = (field) => {
  return body(field)
    .optional()
    .custom((value) => {
      if (!value) return true;
      return isValidHexColor(value) || 'Invalid hex color format';
    });
};

const validateTheme = [
  validateHexColor('primaryColor'),
  validateHexColor('secondaryColor'),
  validateHexColor('accentColor'),
  
  body('typography')
    .optional()
    .isObject()
    .withMessage('Typography must be an object'),
  
  body('spacing')
    .optional()
    .isObject()
    .withMessage('Spacing must be an object'),
  
  body('borderRadius')
    .optional()
    .isObject()
    .withMessage('Border radius must be an object'),
  
  body('branding')
    .optional()
    .isObject()
    .withMessage('Branding must be an object'),
  
  body('darkMode')
    .optional()
    .isObject()
    .withMessage('Dark mode must be an object'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const validatePrimaryColor = [
  body('primaryColor')
    .trim()
    .notEmpty()
    .withMessage('Primary color is required')
    .custom((value) => {
      return isValidHexColor(value) || 'Invalid hex color format';
    })
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid theme ID')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// ======================
// PUBLIC ROUTES
// ======================

// @route   GET /api/theme
// @desc    Get active theme
// @access  Public
router.get('/', getActiveTheme);

// ======================
// ADMIN ROUTES
// ======================

// @route   GET /api/admin/themes
// @desc    Get all themes
// @access  Private (Admin)
router.get('/admin/all', auth, validatePagination, getAllThemes);

// @route   GET /api/admin/themes/:id
// @desc    Get theme by ID
// @access  Private (Admin)
router.get('/admin/:id', auth, validateId, getThemeById);

// @route   POST /api/admin/themes
// @desc    Create or update theme
// @access  Private (Admin)
router.post('/admin', auth, validateTheme, createOrUpdateTheme);

// @route   PUT /api/admin/themes/primary-color
// @desc    Update primary color only
// @access  Private (Admin)
router.put('/admin/primary-color', auth, validatePrimaryColor, updatePrimaryColor);

// @route   POST /api/admin/themes/reset
// @desc    Reset theme to default
// @access  Private (Admin)
router.post('/admin/reset', auth, resetTheme);

// @route   DELETE /api/admin/themes/:id
// @desc    Delete theme
// @access  Private (Admin)
router.delete('/admin/:id', auth, validateId, deleteTheme);

// @route   POST /api/admin/themes/upload-logo
// @desc    Upload theme logo
// @access  Private (Admin)
router.post('/admin/upload-logo', auth, (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
}, uploadLogo);

// @route   POST /api/admin/themes/upload-favicon
// @desc    Upload theme favicon
// @access  Private (Admin)
router.post('/admin/upload-favicon', auth, (req, res, next) => {
  upload.single('favicon')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
}, uploadFavicon);

// @route   DELETE /api/admin/themes/logo
// @desc    Delete theme logo
// @access  Private (Admin)
router.delete('/admin/logo', auth, deleteLogo);

// @route   DELETE /api/admin/themes/favicon
// @desc    Delete theme favicon
// @access  Private (Admin)
router.delete('/admin/favicon', auth, deleteFavicon);

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



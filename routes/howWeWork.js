const express = require('express');
const { body, param } = require('express-validator');
const { upload } = require('../config/cloudinary');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');
const {
  getWorkSteps,
  getAdminWorkSteps,
  updateWorkSteps,
  updateSingleStep,
  updateStatus
} = require('../controllers/howWeWorkController');

const router = express.Router();

// Configure multer for step images
const stepImagesUpload = upload.fields([
  { name: 'stepImage1', maxCount: 1 },
  { name: 'stepImage2', maxCount: 1 },
  { name: 'stepImage3', maxCount: 1 }
]);

const singleStepImageUpload = upload.single('stepImage');

// Validation middleware
const validateWorkSteps = [
  body('steps')
    .custom((value) => {
      let steps = value;
      if (typeof value === 'string') {
        steps = JSON.parse(value);
      }
      return Array.isArray(steps) && steps.length === 3;
    })
    .withMessage('Exactly 3 steps are required'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const validateSingleStep = [
  param('order')
    .isInt({ min: 1, max: 3 })
    .withMessage('Order must be 1, 2, or 3'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1-100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Description must be between 1-300 characters'),
  
  body('imageAlt')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Image alt text cannot exceed 100 characters')
];

const validateStatus = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Public Routes
// Get active work steps for landing page
router.get('/', getWorkSteps);

// Admin Routes (Protected)
// Get work steps for admin
router.get('/admin', protect, admin, getAdminWorkSteps);

// Update all work steps
router.put('/admin', 
  protect, 
  admin, 
  stepImagesUpload,
  validateWorkSteps, 
  updateWorkSteps
);

// Update single step by order (1, 2, or 3)
router.patch('/admin/step/:order', 
  protect, 
  admin, 
  singleStepImageUpload,
  validateSingleStep, 
  updateSingleStep
);

// Update status (active/inactive)
router.patch('/admin/status', 
  protect, 
  admin, 
  validateStatus, 
  updateStatus
);

module.exports = router;


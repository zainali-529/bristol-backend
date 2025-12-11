const express = require('express');
const { body, param, query } = require('express-validator');
const { auth, adminAuth, developerAuth } = require('../middleware/auth');
const { uploadPaymentScreenshot } = require('../config/cloudinaryPayments');
const {
  createPaymentRequest,
  getDeveloperPayments,
  approvePaymentRequest,
  rejectPaymentRequest,
  getPaymentById,
  getAdminPaymentStatus,
} = require('../controllers/paymentController');

const router = express.Router();

// Validation
const validateCreate = [
  body('featureKey').trim().isLength({ min: 2, max: 50 }),
  body('product').trim().isLength({ min: 2, max: 100 }),
  body('pricePKR').optional().isNumeric(),
  body('priceGBP').optional().isNumeric(),
  body('email').optional().isEmail(),
  body('paymentDate').optional().isISO8601(),
];

const validateId = [param('id').isMongoId()];
const validateFeatureKey = [param('featureKey').isLength({ min: 2, max: 50 })];

// Admin submits payment request
router.post(
  '/admin',
  auth,
  adminAuth,
  (req, res, next) => {
    uploadPaymentScreenshot.single('screenshot')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  validateCreate,
  createPaymentRequest
);

// Admin: get latest payment status for a feature
router.get('/admin/:featureKey', auth, adminAuth, validateFeatureKey, getAdminPaymentStatus);

// Developer lists payment requests
router.get('/developer', auth, developerAuth, getDeveloperPayments);

// Developer views single payment
router.get('/developer/:id', auth, developerAuth, validateId, getPaymentById);

// Developer approves payment
router.patch('/developer/:id/approve', auth, developerAuth, validateId, approvePaymentRequest);

// Developer rejects payment
router.patch('/developer/:id/reject', auth, developerAuth, validateId, rejectPaymentRequest);

module.exports = router;

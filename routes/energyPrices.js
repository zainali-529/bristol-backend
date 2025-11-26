const express = require('express');
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  // Public routes
  getCurrentPrices,
  getPriceHistory,
  getMarketStats,
  getComparisonData,
  subscribeToPriceAlerts,
  unsubscribeFromPriceAlerts,
  
  // Admin routes
  getAllEnergyPrices,
  getEnergyPriceById,
  createOrUpdateEnergyPrice,
  updateMarketInsights,
  deleteEnergyPrice,
  getAllSubscriptions,
  getSubscriptionStats
} = require('../controllers/energyPriceController');

const router = express.Router();

// ======================
// VALIDATION MIDDLEWARE
// ======================

const validatePriceUpdate = [
  body('electricityPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Electricity price must be a positive number'),
  
  body('gasPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Gas price must be a positive number'),
  
  body('insights')
    .optional()
    .isObject()
    .withMessage('Insights must be an object'),
  
  body('insights.marketStatus')
    .optional()
    .isIn(['rising', 'falling', 'stable'])
    .withMessage('Market status must be one of: rising, falling, stable'),
  
  body('insights.sentiment')
    .optional()
    .isIn(['positive', 'negative', 'neutral'])
    .withMessage('Sentiment must be one of: positive, negative, neutral'),
  
  body('insights.recommendation')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Recommendation cannot exceed 500 characters')
];

const validateInsights = [
  body('marketStatus')
    .optional()
    .isIn(['rising', 'falling', 'stable'])
    .withMessage('Market status must be one of: rising, falling, stable'),
  
  body('sentiment')
    .optional()
    .isIn(['positive', 'negative', 'neutral'])
    .withMessage('Sentiment must be one of: positive, negative, neutral'),
  
  body('recommendation')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Recommendation must be between 1-500 characters')
];

const validateSubscription = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
  
  body('preferences.electricityThreshold')
    .optional()
    .isFloat()
    .withMessage('Electricity threshold must be a number'),
  
  body('preferences.gasThreshold')
    .optional()
    .isFloat()
    .withMessage('Gas threshold must be a number'),
  
  body('preferences.notifyOnDrop')
    .optional()
    .isBoolean()
    .withMessage('Notify on drop must be a boolean'),
  
  body('preferences.notifyOnRise')
    .optional()
    .isBoolean()
    .withMessage('Notify on rise must be a boolean')
];

const validateUnsubscribe = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Unsubscribe token is required')
];

const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid energy price ID')
];

const validateTimeRange = [
  query('range')
    .optional()
    .isIn(['7d', '30d', '3m', '12m'])
    .withMessage('Range must be one of: 7d, 30d, 3m, 12m')
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
// PUBLIC ROUTES (User Site)
// ======================

// @route   GET /api/energy-prices/current
// @desc    Get current energy prices
// @access  Public
router.get('/current', getCurrentPrices);

// @route   GET /api/energy-prices/history
// @desc    Get price history for a time range
// @access  Public
router.get('/history', validateTimeRange, getPriceHistory);

// @route   GET /api/energy-prices/market-stats
// @desc    Get market statistics
// @access  Public
router.get('/market-stats', getMarketStats);

// @route   GET /api/energy-prices/comparison
// @desc    Get comparison data for electricity and gas
// @access  Public
router.get('/comparison', validateTimeRange, getComparisonData);

// @route   POST /api/energy-prices/subscribe
// @desc    Subscribe to price alerts
// @access  Public
router.post('/subscribe', validateSubscription, subscribeToPriceAlerts);

// @route   POST /api/energy-prices/unsubscribe
// @desc    Unsubscribe from price alerts
// @access  Public
router.post('/unsubscribe', validateUnsubscribe, unsubscribeFromPriceAlerts);

// ======================
// ADMIN ROUTES
// ======================

// @route   GET /api/energy-prices/admin/all
// @desc    Get all energy prices (Admin)
// @access  Private (Admin)
router.get('/admin/all', auth, validatePagination, getAllEnergyPrices);

// @route   GET /api/energy-prices/admin/subscriptions
// @desc    Get all price alert subscriptions (Admin)
// @access  Private (Admin)
router.get('/admin/subscriptions', auth, validatePagination, getAllSubscriptions);

// @route   GET /api/energy-prices/admin/subscription-stats
// @desc    Get subscription statistics (Admin)
// @access  Private (Admin)
router.get('/admin/subscription-stats', auth, getSubscriptionStats);

// @route   GET /api/energy-prices/admin/:id
// @desc    Get single energy price by ID (Admin)
// @access  Private (Admin)
router.get('/admin/:id', auth, validateId, getEnergyPriceById);

// @route   POST /api/energy-prices/admin
// @desc    Create or update energy prices (Admin)
// @access  Private (Admin)
router.post('/admin', auth, validatePriceUpdate, createOrUpdateEnergyPrice);

// @route   PUT /api/energy-prices/admin/insights
// @desc    Update market insights (Admin)
// @access  Private (Admin)
router.put('/admin/insights', auth, validateInsights, updateMarketInsights);

// @route   DELETE /api/energy-prices/admin/:id
// @desc    Delete energy price data (Admin)
// @access  Private (Admin)
router.delete('/admin/:id', auth, validateId, deleteEnergyPrice);

module.exports = router;


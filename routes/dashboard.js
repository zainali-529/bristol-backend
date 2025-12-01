const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(auth);

// Overall Dashboard Stats
router.get('/overall', dashboardController.getOverallStats);

// Time-Based Analytics
router.get('/analytics/time-based', dashboardController.getTimeBasedAnalytics);

// Daily Trends
router.get('/analytics/daily-trends', dashboardController.getDailyTrends);

// Quote Statistics
router.get('/quotes', dashboardController.getQuoteStats);

// Contact Statistics
router.get('/contacts', dashboardController.getContactStats);

// News Statistics
router.get('/news', dashboardController.getNewsStats);

// Document Statistics
router.get('/documents', dashboardController.getDocumentStats);

// Energy Price Trends
router.get('/energy-prices', dashboardController.getEnergyPriceTrends);

// Content Statistics
router.get('/content', dashboardController.getContentStats);

// Recent Activity
router.get('/recent-activity', dashboardController.getRecentActivity);

// Growth Metrics
router.get('/growth', dashboardController.getGrowthMetrics);

// Comprehensive Dashboard Data (All-in-one endpoint)
router.get('/', dashboardController.getDashboardData);

module.exports = router;



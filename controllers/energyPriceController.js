const EnergyPrice = require('../models/EnergyPrice');
const PriceAlert = require('../models/PriceAlert');
const { validationResult } = require('express-validator');

// ======================
// PUBLIC ROUTES (User Site)
// ======================

// @desc    Get current energy prices
// @route   GET /api/energy-prices/current
// @access  Public
const getCurrentPrices = async (req, res) => {
  try {
    const priceData = await EnergyPrice.getCurrentPrices();

    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'No price data available'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        electricity: {
          current: priceData.electricity.current,
          unit: priceData.electricity.unit
        },
        gas: {
          current: priceData.gas.current,
          unit: priceData.gas.unit
        },
        insights: priceData.insights,
        lastUpdate: priceData.updatedAt
      }
    });
  } catch (error) {
    console.error('Get current prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current prices'
    });
  }
};

// @desc    Get price history for a time range
// @route   GET /api/energy-prices/history
// @access  Public
const getPriceHistory = async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Convert range to days
    let days;
    switch (range) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '3m':
        days = 90;
        break;
      case '12m':
        days = 365;
        break;
      default:
        days = 30;
    }

    const priceData = await EnergyPrice.getPriceHistory(days);

    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'No price history available'
      });
    }

    // Filter history by date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filterHistory = (history) => {
      return history.filter(entry => new Date(entry.date) >= startDate);
    };

    const electricityHistory = filterHistory(priceData.electricity.history);
    const gasHistory = filterHistory(priceData.gas.history);

    // Calculate change for current vs previous
    const calculateChange = (history) => {
      if (history.length < 2) return { change: 0, trend: 'stable' };
      const current = history[history.length - 1];
      const previous = history[history.length - 2];
      const change = ((current.price - previous.price) / previous.price) * 100;
      
      let trend = 'stable';
      if (change > 0.5) trend = 'up';
      else if (change < -0.5) trend = 'down';
      
      return {
        change: parseFloat(change.toFixed(2)),
        trend
      };
    };

    const electricityChange = calculateChange(electricityHistory);
    const gasChange = calculateChange(gasHistory);

    res.status(200).json({
      success: true,
      data: {
        electricity: {
          current: priceData.electricity.current,
          change: electricityChange.change,
          trend: electricityChange.trend,
          history: electricityHistory.map(h => ({
            date: h.date,
            price: h.price,
            change: h.change,
            trend: h.trend
          })),
          average: priceData.electricity.average,
          high: priceData.electricity.high,
          low: priceData.electricity.low,
          unit: priceData.electricity.unit,
          type: 'electricity'
        },
        gas: {
          current: priceData.gas.current,
          change: gasChange.change,
          trend: gasChange.trend,
          history: gasHistory.map(h => ({
            date: h.date,
            price: h.price,
            change: h.change,
            trend: h.trend
          })),
          average: priceData.gas.average,
          high: priceData.gas.high,
          low: priceData.gas.low,
          unit: priceData.gas.unit,
          type: 'gas'
        },
        insights: priceData.insights,
        range,
        generatedAt: priceData.updatedAt
      }
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price history'
    });
  }
};

// @desc    Get market statistics
// @route   GET /api/energy-prices/market-stats
// @access  Public
const getMarketStats = async (req, res) => {
  try {
    const priceData = await EnergyPrice.findOne({ isActive: true })
      .sort({ createdAt: -1 });

    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'No market data available'
      });
    }

    // Calculate monthly and yearly changes
    const calculatePeriodChange = (history, days) => {
      if (history.length < days) return 0;
      const recent = history.slice(-days);
      const oldest = recent[0].price;
      const newest = recent[recent.length - 1].price;
      return ((newest - oldest) / oldest) * 100;
    };

    const monthlyElecChange = calculatePeriodChange(priceData.electricity.history, 30);
    const monthlyGasChange = calculatePeriodChange(priceData.gas.history, 30);

    res.status(200).json({
      success: true,
      data: {
        current: {
          electricity: priceData.electricity.current,
          gas: priceData.gas.current
        },
        monthly: {
          electricityChange: parseFloat(monthlyElecChange.toFixed(2)),
          gasChange: parseFloat(monthlyGasChange.toFixed(2))
        },
        insights: priceData.insights,
        lastUpdate: priceData.updatedAt
      }
    });
  } catch (error) {
    console.error('Get market stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market statistics'
    });
  }
};

// @desc    Get comparison data for electricity and gas
// @route   GET /api/energy-prices/comparison
// @access  Public
const getComparisonData = async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    let days;
    switch (range) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '3m': days = 90; break;
      case '12m': days = 365; break;
      default: days = 30;
    }

    const priceData = await EnergyPrice.getPriceHistory(days);

    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'No comparison data available'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const electricityHistory = priceData.electricity.history.filter(
      entry => new Date(entry.date) >= startDate
    );
    const gasHistory = priceData.gas.history.filter(
      entry => new Date(entry.date) >= startDate
    );

    // Combine data for comparison
    const comparisonData = electricityHistory.map((elec, index) => ({
      date: elec.date,
      electricity: elec.price,
      gas: gasHistory[index]?.price || 0
    }));

    res.status(200).json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    console.error('Get comparison data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparison data'
    });
  }
};

// @desc    Subscribe to price alerts
// @route   POST /api/energy-prices/subscribe
// @access  Public
const subscribeToPriceAlerts = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, preferences } = req.body;

    // Check if email already exists
    let subscription = await PriceAlert.findOne({ email });

    if (subscription) {
      // Reactivate if previously unsubscribed
      if (!subscription.isActive) {
        subscription.isActive = true;
        if (preferences) {
          subscription.preferences = { ...subscription.preferences, ...preferences };
        }
        await subscription.save();

        return res.status(200).json({
          success: true,
          message: 'Price alert subscription reactivated successfully!'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Email is already subscribed to price alerts'
      });
    }

    // Create new subscription
    subscription = new PriceAlert({
      email,
      preferences: preferences || {}
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to price alerts! You will receive notifications when prices change.'
    });
  } catch (error) {
    console.error('Subscribe to price alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to price alerts'
    });
  }
};

// @desc    Unsubscribe from price alerts
// @route   POST /api/energy-prices/unsubscribe
// @access  Public
const unsubscribeFromPriceAlerts = async (req, res) => {
  try {
    const { token } = req.body;

    const subscription = await PriceAlert.findOne({ unsubscribeToken: token });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Invalid unsubscribe token'
      });
    }

    subscription.isActive = false;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from price alerts'
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from price alerts'
    });
  }
};

// ======================
// ADMIN ROUTES
// ======================

// @desc    Get all energy prices (Admin)
// @route   GET /api/admin/energy-prices
// @access  Private (Admin)
const getAllEnergyPrices = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const prices = await EnergyPrice.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await EnergyPrice.countDocuments(query);

    res.status(200).json({
      success: true,
      data: prices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get all energy prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch energy prices'
    });
  }
};

// @desc    Get single energy price by ID (Admin)
// @route   GET /api/admin/energy-prices/:id
// @access  Private (Admin)
const getEnergyPriceById = async (req, res) => {
  try {
    const priceData = await EnergyPrice.findById(req.params.id);

    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'Energy price data not found'
      });
    }

    res.status(200).json({
      success: true,
      data: priceData
    });
  } catch (error) {
    console.error('Get energy price by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch energy price data'
    });
  }
};

// @desc    Create or update energy prices (Admin)
// @route   POST /api/admin/energy-prices
// @access  Private (Admin)
const createOrUpdateEnergyPrice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { electricityPrice, gasPrice, insights } = req.body;

    // Get the current active price data or create new
    let priceData = await EnergyPrice.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!priceData) {
      // Create new price data
      priceData = new EnergyPrice({
        electricity: {
          current: electricityPrice,
          history: [{
            price: electricityPrice,
            date: new Date(),
            change: 0,
            trend: 'stable'
          }]
        },
        gas: {
          current: gasPrice,
          history: [{
            price: gasPrice,
            date: new Date(),
            change: 0,
            trend: 'stable'
          }]
        },
        insights: insights || {}
      });
    } else {
      // Update existing price data
      if (electricityPrice !== undefined && electricityPrice !== priceData.electricity.current) {
        priceData.addPriceEntry('electricity', electricityPrice);
      }
      
      if (gasPrice !== undefined && gasPrice !== priceData.gas.current) {
        priceData.addPriceEntry('gas', gasPrice);
      }

      if (insights) {
        priceData.insights = { ...priceData.insights, ...insights };
      }
    }

    await priceData.save();

    res.status(200).json({
      success: true,
      message: 'Energy prices updated successfully',
      data: priceData
    });
  } catch (error) {
    console.error('Create/update energy price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update energy prices'
    });
  }
};

// @desc    Update market insights (Admin)
// @route   PUT /api/admin/energy-prices/insights
// @access  Private (Admin)
const updateMarketInsights = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { marketStatus, recommendation, sentiment } = req.body;

    const priceData = await EnergyPrice.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'No active price data found'
      });
    }

    if (marketStatus) priceData.insights.marketStatus = marketStatus;
    if (recommendation) priceData.insights.recommendation = recommendation;
    if (sentiment) priceData.insights.sentiment = sentiment;

    await priceData.save();

    res.status(200).json({
      success: true,
      message: 'Market insights updated successfully',
      data: priceData.insights
    });
  } catch (error) {
    console.error('Update market insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update market insights'
    });
  }
};

// @desc    Delete energy price data (Admin)
// @route   DELETE /api/admin/energy-prices/:id
// @access  Private (Admin)
const deleteEnergyPrice = async (req, res) => {
  try {
    const priceData = await EnergyPrice.findById(req.params.id);

    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'Energy price data not found'
      });
    }

    await priceData.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Energy price data deleted successfully'
    });
  } catch (error) {
    console.error('Delete energy price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete energy price data'
    });
  }
};

// @desc    Get all price alert subscriptions (Admin)
// @route   GET /api/admin/energy-prices/subscriptions
// @access  Private (Admin)
const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subscriptions = await PriceAlert.find(query)
      .sort({ subscribedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PriceAlert.countDocuments(query);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
};

// @desc    Get subscription statistics (Admin)
// @route   GET /api/admin/energy-prices/subscription-stats
// @access  Private (Admin)
const getSubscriptionStats = async (req, res) => {
  try {
    const totalSubscriptions = await PriceAlert.countDocuments();
    const activeSubscriptions = await PriceAlert.countDocuments({ isActive: true });
    const inactiveSubscriptions = await PriceAlert.countDocuments({ isActive: false });

    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubscriptions = await PriceAlert.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        inactive: inactiveSubscriptions,
        recentSubscriptions: recentSubscriptions
      }
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription statistics'
    });
  }
};

module.exports = {
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
};


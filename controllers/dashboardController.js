const Contact = require('../models/Contact');
const Quote = require('../models/Quote');
const News = require('../models/News');
const Document = require('../models/Document');
const EnergyPrice = require('../models/EnergyPrice');
const Service = require('../models/Service');
const Supplier = require('../models/Supplier');
const TeamMember = require('../models/TeamMember');
const Testimonial = require('../models/Testimonial');
const Industry = require('../models/Industry');
const FAQ = require('../models/FAQ');

// Helper function to get date ranges
const getDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  return { startDate, endDate: new Date() };
};

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(2);
};

// Get Overall Dashboard Stats
exports.getOverallStats = async (req, res) => {
  try {
    const [
      totalContacts,
      totalQuotes,
      totalNews,
      totalDocuments,
      totalServices,
      totalSuppliers,
      totalTeamMembers,
      totalTestimonials,
      totalIndustries,
      totalFAQs,
      activeContacts,
      activeQuotes,
      publishedNews,
      activeDocuments,
      activeServices,
      activeSuppliers,
      activeTeamMembers,
      activeTestimonials,
      activeIndustries,
      activeFAQs
    ] = await Promise.all([
      Contact.countDocuments(),
      Quote.countDocuments(),
      News.countDocuments(),
      Document.countDocuments(),
      Service.countDocuments(),
      Supplier.countDocuments(),
      TeamMember.countDocuments(),
      Testimonial.countDocuments(),
      Industry.countDocuments(),
      FAQ.countDocuments(),
      Contact.countDocuments({ status: { $ne: 'resolved' } }),
      Quote.countDocuments({ status: { $ne: 'closed' } }),
      News.countDocuments({ status: 'published', isActive: true }),
      Document.countDocuments({ isActive: true, isArchived: false }),
      Service.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: true }),
      TeamMember.countDocuments({ isActive: true }),
      Testimonial.countDocuments({ isActive: true }),
      Industry.countDocuments({ isActive: true }),
      FAQ.countDocuments({ isActive: true })
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      recentContacts,
      recentQuotes,
      recentNews,
      recentDocuments
    ] = await Promise.all([
      Contact.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Quote.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      News.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Document.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalContacts,
          totalQuotes,
          totalNews,
          totalDocuments,
          totalServices,
          totalSuppliers,
          totalTeamMembers,
          totalTestimonials,
          totalIndustries,
          totalFAQs
        },
        active: {
          activeContacts,
          activeQuotes,
          publishedNews,
          activeDocuments,
          activeServices,
          activeSuppliers,
          activeTeamMembers,
          activeTestimonials,
          activeIndustries,
          activeFAQs
        },
        recentActivity: {
          recentContacts,
          recentQuotes,
          recentNews,
          recentDocuments,
          period: '7 days'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overall stats',
      error: error.message
    });
  }
};

// Get Time-Based Analytics
exports.getTimeBasedAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get previous period for comparison
    const periodDays = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    const previousEndDate = new Date(startDate);

    // Current period stats
    const [
      currentContacts,
      currentQuotes,
      currentNews,
      currentDocuments
    ] = await Promise.all([
      Contact.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Quote.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      News.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Document.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
    ]);

    // Previous period stats
    const [
      previousContacts,
      previousQuotes,
      previousNews,
      previousDocuments
    ] = await Promise.all([
      Contact.countDocuments({ createdAt: { $gte: previousStartDate, $lte: previousEndDate } }),
      Quote.countDocuments({ createdAt: { $gte: previousStartDate, $lte: previousEndDate } }),
      News.countDocuments({ createdAt: { $gte: previousStartDate, $lte: previousEndDate } }),
      Document.countDocuments({ createdAt: { $gte: previousStartDate, $lte: previousEndDate } })
    ]);

    res.json({
      success: true,
      data: {
        period,
        current: {
          contacts: currentContacts,
          quotes: currentQuotes,
          news: currentNews,
          documents: currentDocuments
        },
        previous: {
          contacts: previousContacts,
          quotes: previousQuotes,
          news: previousNews,
          documents: previousDocuments
        },
        change: {
          contacts: calculatePercentageChange(currentContacts, previousContacts),
          quotes: calculatePercentageChange(currentQuotes, previousQuotes),
          news: calculatePercentageChange(currentNews, previousNews),
          documents: calculatePercentageChange(currentDocuments, previousDocuments)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching time-based analytics',
      error: error.message
    });
  }
};

// Get Daily Trends (Last 30 Days)
exports.getDailyTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily breakdown
    const dailyContacts = await Contact.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);

    const dailyQuotes = await Quote.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);

    const dailyNews = await News.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        trends: {
          contacts: dailyContacts,
          quotes: dailyQuotes,
          news: dailyNews
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching daily trends',
      error: error.message
    });
  }
};

// Get Quote Statistics
exports.getQuoteStats = async (req, res) => {
  try {
    const [
      totalQuotes,
      quotesByStatus,
      quotesByBusinessType,
      recentQuotes,
      averageQuoteValue,
      totalQuoteValue
    ] = await Promise.all([
      Quote.countDocuments(),
      Quote.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      Quote.aggregate([
        { $group: { _id: '$businessType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { businessType: '$_id', count: 1, _id: 0 } }
      ]),
      Quote.find().sort({ createdAt: -1 }).limit(10).select('businessName email status createdAt'),
      Quote.aggregate([
        { $match: { quoteValue: { $ne: null, $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$quoteValue' }, total: { $sum: '$quoteValue' } } }
      ])
    ]);

    // Get quotes by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const quotesByMonth = await Quote.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        totalQuotes,
        quotesByStatus,
        quotesByBusinessType,
        quotesByMonth,
        recentQuotes,
        financials: {
          averageQuoteValue: averageQuoteValue[0]?.avg || 0,
          totalQuoteValue: totalQuoteValue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quote stats',
      error: error.message
    });
  }
};

// Get Contact Statistics
exports.getContactStats = async (req, res) => {
  try {
    const [
      totalContacts,
      contactsByStatus,
      contactsByService,
      recentContacts
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      Contact.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { service: '$_id', count: 1, _id: 0 } }
      ]),
      Contact.find().sort({ createdAt: -1 }).limit(10).select('name email service status createdAt')
    ]);

    // Get contacts by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const contactsByMonth = await Contact.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        totalContacts,
        contactsByStatus,
        contactsByService,
        contactsByMonth,
        recentContacts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contact stats',
      error: error.message
    });
  }
};

// Get News Statistics
exports.getNewsStats = async (req, res) => {
  try {
    const [
      totalNews,
      publishedNews,
      draftNews,
      archivedNews,
      newsByCategory,
      newsByStatus,
      topViewedNews,
      recentNews
    ] = await Promise.all([
      News.countDocuments(),
      News.countDocuments({ status: 'published', isActive: true }),
      News.countDocuments({ status: 'draft' }),
      News.countDocuments({ status: 'archived' }),
      News.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]),
      News.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      News.find({ status: 'published' })
        .sort({ views: -1 })
        .limit(10)
        .select('title views category publishDate'),
      News.find().sort({ createdAt: -1 }).limit(10).select('title status category createdAt')
    ]);

    // Get total views
    const totalViews = await News.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    // Get news by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const newsByMonth = await News.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        totalNews,
        publishedNews,
        draftNews,
        archivedNews,
        newsByCategory,
        newsByStatus,
        newsByMonth,
        topViewedNews,
        recentNews,
        totalViews: totalViews[0]?.totalViews || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching news stats',
      error: error.message
    });
  }
};

// Get Document Statistics
exports.getDocumentStats = async (req, res) => {
  try {
    const [
      totalDocuments,
      documentsByCategory,
      documentsByAccessLevel,
      recentDocuments,
      totalFileSize
    ] = await Promise.all([
      Document.countDocuments(),
      Document.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]),
      Document.aggregate([
        { $group: { _id: '$accessLevel', count: { $sum: 1 } } },
        { $project: { accessLevel: '$_id', count: 1, _id: 0 } }
      ]),
      Document.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title category accessLevel createdAt file.fileSize'),
      Document.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$file.fileSize' } } }
      ])
    ]);

    // Get documents by file type
    const documentsByFileType = await Document.aggregate([
      { $group: { _id: '$file.fileExtension', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { fileType: '$_id', count: 1, _id: 0 } }
    ]);

    // Get documents by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const documentsByMonth = await Document.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        totalDocuments,
        documentsByCategory,
        documentsByFileType,
        documentsByAccessLevel,
        documentsByMonth,
        recentDocuments,
        totalFileSize: totalFileSize[0]?.totalSize || 0,
        totalFileSizeFormatted: formatBytes(totalFileSize[0]?.totalSize || 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching document stats',
      error: error.message
    });
  }
};

// Helper function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get Energy Price Trends
exports.getEnergyPriceTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const energyPrice = await EnergyPrice.findOne({ isActive: true })
      .sort({ createdAt: -1 });

    if (!energyPrice) {
      return res.json({
        success: true,
        data: {
          current: {
            electricity: 0,
            gas: 0
          },
          trends: {
            electricity: [],
            gas: []
          },
          message: 'No energy price data available'
        }
      });
    }

    // Get recent history
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const electricityHistory = energyPrice.electricity.history
      .filter(entry => new Date(entry.date) >= startDate)
      .map(entry => ({
        date: entry.date,
        price: entry.price,
        change: entry.change,
        trend: entry.trend
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const gasHistory = energyPrice.gas.history
      .filter(entry => new Date(entry.date) >= startDate)
      .map(entry => ({
        date: entry.date,
        price: entry.price,
        change: entry.change,
        trend: entry.trend
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        current: {
          electricity: {
            price: energyPrice.electricity.current,
            unit: energyPrice.electricity.unit,
            average: energyPrice.electricity.average,
            high: energyPrice.electricity.high,
            low: energyPrice.electricity.low
          },
          gas: {
            price: energyPrice.gas.current,
            unit: energyPrice.gas.unit,
            average: energyPrice.gas.average,
            high: energyPrice.gas.high,
            low: energyPrice.gas.low
          }
        },
        trends: {
          electricity: electricityHistory,
          gas: gasHistory
        },
        insights: energyPrice.insights,
        period: `${days} days`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching energy price trends',
      error: error.message
    });
  }
};

// Get Content Statistics
exports.getContentStats = async (req, res) => {
  try {
    const [
      totalServices,
      activeServices,
      featuredServices,
      totalSuppliers,
      activeSuppliers,
      totalTeamMembers,
      activeTeamMembers,
      totalTestimonials,
      activeTestimonials,
      totalIndustries,
      activeIndustries,
      totalFAQs,
      activeFAQs
    ] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true, isFeatured: true }),
      Supplier.countDocuments(),
      Supplier.countDocuments({ isActive: true }),
      TeamMember.countDocuments(),
      TeamMember.countDocuments({ isActive: true }),
      Testimonial.countDocuments(),
      Testimonial.countDocuments({ isActive: true }),
      Industry.countDocuments(),
      Industry.countDocuments({ isActive: true }),
      FAQ.countDocuments(),
      FAQ.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      data: {
        services: {
          total: totalServices,
          active: activeServices,
          featured: featuredServices
        },
        suppliers: {
          total: totalSuppliers,
          active: activeSuppliers
        },
        teamMembers: {
          total: totalTeamMembers,
          active: activeTeamMembers
        },
        testimonials: {
          total: totalTestimonials,
          active: activeTestimonials
        },
        industries: {
          total: totalIndustries,
          active: activeIndustries
        },
        faqs: {
          total: totalFAQs,
          active: activeFAQs
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching content stats',
      error: error.message
    });
  }
};

// Get Recent Activity
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [
      recentContacts,
      recentQuotes,
      recentNews,
      recentDocuments
    ] = await Promise.all([
      Contact.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name email service status createdAt'),
      Quote.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('businessName email status createdAt'),
      News.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title status category createdAt'),
      Document.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title category accessLevel createdAt')
    ]);

    // Combine and sort by date
    const allActivity = [
      ...recentContacts.map(item => ({ ...item.toObject(), type: 'contact' })),
      ...recentQuotes.map(item => ({ ...item.toObject(), type: 'quote' })),
      ...recentNews.map(item => ({ ...item.toObject(), type: 'news' })),
      ...recentDocuments.map(item => ({ ...item.toObject(), type: 'document' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);

    res.json({
      success: true,
      data: {
        recentActivity: allActivity,
        summary: {
          contacts: recentContacts.length,
          quotes: recentQuotes.length,
          news: recentNews.length,
          documents: recentDocuments.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
};

// Get Growth Metrics
exports.getGrowthMetrics = async (req, res) => {
  try {
    const now = new Date();
    
    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Previous month
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month stats
    const [
      currentMonthContacts,
      currentMonthQuotes,
      currentMonthNews,
      currentMonthDocuments
    ] = await Promise.all([
      Contact.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      Quote.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      News.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      Document.countDocuments({ createdAt: { $gte: currentMonthStart } })
    ]);

    // Previous month stats
    const [
      previousMonthContacts,
      previousMonthQuotes,
      previousMonthNews,
      previousMonthDocuments
    ] = await Promise.all([
      Contact.countDocuments({ 
        createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } 
      }),
      Quote.countDocuments({ 
        createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } 
      }),
      News.countDocuments({ 
        createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } 
      }),
      Document.countDocuments({ 
        createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } 
      })
    ]);

    res.json({
      success: true,
      data: {
        currentMonth: {
          contacts: currentMonthContacts,
          quotes: currentMonthQuotes,
          news: currentMonthNews,
          documents: currentMonthDocuments
        },
        previousMonth: {
          contacts: previousMonthContacts,
          quotes: previousMonthQuotes,
          news: previousMonthNews,
          documents: previousMonthDocuments
        },
        growth: {
          contacts: calculatePercentageChange(currentMonthContacts, previousMonthContacts),
          quotes: calculatePercentageChange(currentMonthQuotes, previousMonthQuotes),
          news: calculatePercentageChange(currentMonthNews, previousMonthNews),
          documents: calculatePercentageChange(currentMonthDocuments, previousMonthDocuments)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching growth metrics',
      error: error.message
    });
  }
};

// Get Comprehensive Dashboard Data (All-in-one)
exports.getDashboardData = async (req, res) => {
  try {
    // Get all stats in parallel
    const [
      overallStats,
      quoteStats,
      contactStats,
      newsStats,
      documentStats,
      contentStats,
      recentActivity,
      growthMetrics
    ] = await Promise.all([
      // Overall stats
      Promise.all([
        Contact.countDocuments(),
        Quote.countDocuments(),
        News.countDocuments(),
        Document.countDocuments(),
        Service.countDocuments(),
        Supplier.countDocuments()
      ]).then(([contacts, quotes, news, documents, services, suppliers]) => ({
        contacts, quotes, news, documents, services, suppliers
      })),
      
      // Quote stats
      Quote.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      
      // Contact stats
      Contact.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      
      // News stats
      News.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      
      // Document stats
      Document.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]),
      
      // Content stats
      Promise.all([
        Service.countDocuments({ isActive: true }),
        Supplier.countDocuments({ isActive: true }),
        TeamMember.countDocuments({ isActive: true }),
        Testimonial.countDocuments({ isActive: true })
      ]).then(([services, suppliers, teamMembers, testimonials]) => ({
        services, suppliers, teamMembers, testimonials
      })),
      
      // Recent activity (last 10)
      Promise.all([
        Contact.find().sort({ createdAt: -1 }).limit(5).select('name email status createdAt'),
        Quote.find().sort({ createdAt: -1 }).limit(5).select('businessName email status createdAt'),
        News.find().sort({ createdAt: -1 }).limit(5).select('title status createdAt')
      ]).then(([contacts, quotes, news]) => ({
        contacts, quotes, news
      })),
      
      // Growth metrics (current vs previous month)
      (async () => {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const [current, previous] = await Promise.all([
          Promise.all([
            Contact.countDocuments({ createdAt: { $gte: currentMonthStart } }),
            Quote.countDocuments({ createdAt: { $gte: currentMonthStart } })
          ]),
          Promise.all([
            Contact.countDocuments({ createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } }),
            Quote.countDocuments({ createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } })
          ])
        ]);
        
        return {
          contacts: {
            current: current[0],
            previous: previous[0],
            growth: calculatePercentageChange(current[0], previous[0])
          },
          quotes: {
            current: current[1],
            previous: previous[1],
            growth: calculatePercentageChange(current[1], previous[1])
          }
        };
      })()
    ]);

    res.json({
      success: true,
      data: {
        overview: overallStats,
        quotes: {
          byStatus: quoteStats
        },
        contacts: {
          byStatus: contactStats
        },
        news: {
          byStatus: newsStats
        },
        documents: {
          byCategory: documentStats
        },
        content: contentStats,
        recentActivity,
        growth: growthMetrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};



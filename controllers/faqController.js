const FAQ = require('../models/FAQ');

// @desc    Get all active FAQs for public display
// @route   GET /api/faqs
// @access  Public
const getFAQs = async (req, res) => {
  try {
    const { category } = req.query;
    
    const faqs = await FAQ.getActiveFAQs(category);
    
    res.json({
      success: true,
      count: faqs.length,
      data: faqs
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching FAQs'
    });
  }
};

// @desc    Get all FAQ categories
// @route   GET /api/faqs/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await FAQ.getCategories();
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
};

// @desc    Get all FAQs for admin (including inactive)
// @route   GET /api/faqs/admin
// @access  Private/Admin
const getAdminFAQs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }
    
    // Execute query with pagination
    const faqs = await FAQ.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await FAQ.countDocuments(query);
    
    res.json({
      success: true,
      count: faqs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: faqs
    });
  } catch (error) {
    console.error('Error fetching admin FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching FAQs'
    });
  }
};

// @desc    Get single FAQ by ID for admin
// @route   GET /api/faqs/admin/:id
// @access  Private/Admin
const getAdminFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const faq = await FAQ.findById(id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching FAQ'
    });
  }
};

// @desc    Create new FAQ
// @route   POST /api/faqs/admin
// @access  Private/Admin
const createFAQ = async (req, res) => {
  try {
    const faqData = { ...req.body };
    
    const faq = new FAQ(faqData);
    await faq.save();
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating FAQ'
    });
  }
};

// @desc    Update FAQ
// @route   PUT /api/faqs/admin/:id
// @access  Private/Admin
const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: updatedFAQ
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating FAQ'
    });
  }
};

// @desc    Delete FAQ
// @route   DELETE /api/faqs/admin/:id
// @access  Private/Admin
const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    
    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    await FAQ.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting FAQ'
    });
  }
};

// @desc    Update FAQ status (active/inactive)
// @route   PATCH /api/faqs/admin/:id/status
// @access  Private/Admin
const updateFAQStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }
    
    const faq = await FAQ.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.json({
      success: true,
      message: `FAQ ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: faq
    });
  } catch (error) {
    console.error('Error updating FAQ status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating FAQ status'
    });
  }
};

// @desc    Update FAQ display order
// @route   PATCH /api/faqs/admin/:id/order
// @access  Private/Admin
const updateFAQOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;
    
    if (typeof displayOrder !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'displayOrder must be a number'
      });
    }
    
    const faq = await FAQ.findByIdAndUpdate(
      id,
      { displayOrder },
      { new: true, runValidators: true }
    );
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.json({
      success: true,
      message: 'FAQ order updated successfully',
      data: faq
    });
  } catch (error) {
    console.error('Error updating FAQ order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating FAQ order'
    });
  }
};

// @desc    Get FAQ statistics for admin dashboard
// @route   GET /api/faqs/admin/stats
// @access  Private/Admin
const getFAQStats = async (req, res) => {
  try {
    const totalFAQs = await FAQ.countDocuments();
    const activeFAQs = await FAQ.countDocuments({ isActive: true });
    const inactiveFAQs = await FAQ.countDocuments({ isActive: false });
    
    // Get categories count
    const categories = await FAQ.distinct('category');
    const categoriesCount = categories.length;
    
    // Recent FAQs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentFAQs = await FAQ.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // FAQs by category
    const faqsByCategory = await FAQ.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalFAQs,
        active: activeFAQs,
        inactive: inactiveFAQs,
        categories: categoriesCount,
        recent: recentFAQs,
        byCategory: faqsByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching FAQ stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching FAQ statistics'
    });
  }
};

module.exports = {
  getFAQs,
  getCategories,
  getAdminFAQs,
  getAdminFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  updateFAQStatus,
  updateFAQOrder,
  getFAQStats
};


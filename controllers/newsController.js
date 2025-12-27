const News = require('../models/News');
const { deleteImage, extractPublicId } = require('../config/cloudinary');

// @desc    Get all published news for public display (cards)
// @route   GET /api/news
// @access  Public
const getNews = async (req, res) => {
  try {
    const { featured, category, limit, page = 1, perPage = 10 } = req.query;
    
    let query = {
      status: 'published',
      isActive: true
    };
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (category) {
      query.category = category;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(perPage);
    const limitNum = limit ? parseInt(limit) : parseInt(perPage);
    
    const news = await News.find(query)
      .sort({ publishDate: -1, displayOrder: 1 })
      .limit(limitNum)
      .skip(skip)
      .select('title slug cardDescription cardImage publishDate category author views readingTime isFeatured isBreaking');
    
    const total = await News.countDocuments(query);
    
    res.json({
      success: true,
      count: news.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: parseInt(page),
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news'
    });
  }
};

// @desc    Get single news article by slug for public display (detail page)
// @route   GET /api/news/:slug
// @access  Public
const getNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const news = await News.findOne({ 
      slug: slug, 
      status: 'published',
      isActive: true
    });
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    // Get related news
    const relatedNews = await News.getRelatedNews(news._id, news.category, 3);
    
    res.json({
      success: true,
      data: news.getDetailData(),
      relatedNews: relatedNews
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news'
    });
  }
};

// @desc    Get news categories
// @route   GET /api/news/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await News.getCategories();
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
};

// @desc    Get popular tags
// @route   GET /api/news/tags
// @access  Public
const getTags = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const tags = await News.getPopularTags(parseInt(limit));
    
    res.json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tags'
    });
  }
};

// @desc    Get all news for admin (including drafts and archived)
// @route   GET /api/news/admin
// @access  Private/Admin
const getAdminNews = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      category,
      featured,
      isActive 
    } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { cardDescription: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (featured !== undefined) {
      query.isFeatured = featured === 'true';
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Execute query with pagination
    const news = await News.find(query)
      .sort({ publishDate: -1, displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await News.countDocuments(query);
    
    res.json({
      success: true,
      count: news.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: news
    });
  } catch (error) {
    console.error('Error fetching admin news:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news'
    });
  }
};

// @desc    Get single news by ID for admin
// @route   GET /api/news/admin/:id
// @access  Private/Admin
const getAdminNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await News.findById(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news'
    });
  }
};

// @desc    Create new news article
// @route   POST /api/news/admin
// @access  Private/Admin
const createNews = async (req, res) => {
  try {
    const newsData = { ...req.body };
    
    // Handle card image from multer/cloudinary
    if (req.files && req.files.cardImage) {
      newsData.cardImage = {
        url: req.files.cardImage[0].path,
        publicId: req.files.cardImage[0].filename,
        alt: newsData.cardImageAlt || ''
      };
    }
    
    // Handle featured image
    if (req.files && req.files.featuredImage) {
      newsData.featuredImage = {
        url: req.files.featuredImage[0].path,
        publicId: req.files.featuredImage[0].filename,
        alt: newsData.featuredImageAlt || ''
      };
    }
    
    // Handle additional images
    if (req.files && req.files.additionalImages) {
      const additionalImages = Array.isArray(req.files.additionalImages) 
        ? req.files.additionalImages 
        : [req.files.additionalImages];
      
      newsData.additionalImages = additionalImages.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        alt: newsData[`additionalImageAlt${index}`] || '',
        caption: newsData[`additionalImageCaption${index}`] || '',
        order: index
      }));
    }
    
    // Parse tags if string
    if (typeof newsData.tags === 'string') {
      newsData.tags = newsData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Parse metaKeywords if string
    if (typeof newsData.metaKeywords === 'string') {
      newsData.metaKeywords = newsData.metaKeywords.split(',').map(kw => kw.trim()).filter(kw => kw);
    }
    
    // Parse contentSections if string
    if (typeof newsData.contentSections === 'string') {
      try {
        newsData.contentSections = JSON.parse(newsData.contentSections);
      } catch (e) {
        newsData.contentSections = [];
      }
    }
    
    // Parse publishDate if string
    if (newsData.publishDate && typeof newsData.publishDate === 'string') {
      newsData.publishDate = new Date(newsData.publishDate);
    }
    
    const news = new News(newsData);
    await news.save();
    
    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: news
    });
  } catch (error) {
    console.error('Error creating news:', error);
    
    // Clean up uploaded images if creation fails
    if (req.files) {
      if (req.files.cardImage) {
        await deleteImage(req.files.cardImage[0].filename).catch(console.error);
      }
      if (req.files.featuredImage) {
        await deleteImage(req.files.featuredImage[0].filename).catch(console.error);
      }
      if (req.files.additionalImages) {
        const images = Array.isArray(req.files.additionalImages) 
          ? req.files.additionalImages 
          : [req.files.additionalImages];
        for (const file of images) {
          await deleteImage(file.filename).catch(console.error);
        }
      }
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'News article with this slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating news article'
    });
  }
};

// @desc    Update news article
// @route   PUT /api/news/admin/:id
// @access  Private/Admin
const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    // Handle card image update
    if (req.files && req.files.cardImage) {
      // Delete old image
      if (news.cardImage && news.cardImage.publicId) {
        await deleteImage(news.cardImage.publicId).catch(console.error);
      }
      
      updateData.cardImage = {
        url: req.files.cardImage[0].path,
        publicId: req.files.cardImage[0].filename,
        alt: updateData.cardImageAlt || news.cardImage?.alt || ''
      };
    }
    
    // Handle featured image update
    if (req.files && req.files.featuredImage) {
      // Delete old image
      if (news.featuredImage && news.featuredImage.publicId) {
        await deleteImage(news.featuredImage.publicId).catch(console.error);
      }
      
      updateData.featuredImage = {
        url: req.files.featuredImage[0].path,
        publicId: req.files.featuredImage[0].filename,
        alt: updateData.featuredImageAlt || news.featuredImage?.alt || ''
      };
    }
    
    // Handle additional images update (append instead of replace)
    if (req.files && req.files.additionalImages) {
      const existing = Array.isArray(news.additionalImages) ? news.additionalImages : [];
      const startOrder = existing.length;
      const incoming = Array.isArray(req.files.additionalImages)
        ? req.files.additionalImages
        : [req.files.additionalImages];

      const newImages = incoming.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        alt: updateData[`additionalImageAlt${index}`] || '',
        caption: updateData[`additionalImageCaption${index}`] || '',
        order: startOrder + index
      }));

      updateData.additionalImages = [...existing, ...newImages];
    }
    
    // Parse tags if string
    if (typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Parse metaKeywords if string
    if (typeof updateData.metaKeywords === 'string') {
      updateData.metaKeywords = updateData.metaKeywords.split(',').map(kw => kw.trim()).filter(kw => kw);
    }
    
    // Parse contentSections if string
    if (typeof updateData.contentSections === 'string') {
      try {
        updateData.contentSections = JSON.parse(updateData.contentSections);
      } catch (e) {
        // Keep existing if parse fails
      }
    }
    
    // Parse publishDate if string
    if (updateData.publishDate && typeof updateData.publishDate === 'string') {
      updateData.publishDate = new Date(updateData.publishDate);
    }

    // Auto-set publishDate if publishing
    if (updateData.status === 'published' && !updateData.publishDate) {
      if (!news.publishDate || news.status !== 'published') {
        updateData.publishDate = new Date();
      }
    }
    
    const updatedNews = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'News article updated successfully',
      data: updatedNews
    });
  } catch (error) {
    console.error('Error updating news:', error);
    
    // Clean up uploaded images if update fails
    if (req.files) {
      if (req.files.cardImage) {
        await deleteImage(req.files.cardImage[0].filename).catch(console.error);
      }
      if (req.files.featuredImage) {
        await deleteImage(req.files.featuredImage[0].filename).catch(console.error);
      }
      if (req.files.additionalImages) {
        const images = Array.isArray(req.files.additionalImages) 
          ? req.files.additionalImages 
          : [req.files.additionalImages];
        for (const file of images) {
          await deleteImage(file.filename).catch(console.error);
        }
      }
    }
    
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
      message: 'Server error while updating news article'
    });
  }
};

// @desc    Delete news article
// @route   DELETE /api/news/admin/:id
// @access  Private/Admin
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    // Delete images from Cloudinary
    if (news.cardImage && news.cardImage.publicId) {
      await deleteImage(news.cardImage.publicId).catch(console.error);
    }
    
    if (news.featuredImage && news.featuredImage.publicId) {
      await deleteImage(news.featuredImage.publicId).catch(console.error);
    }
    
    if (news.additionalImages && news.additionalImages.length > 0) {
      for (const img of news.additionalImages) {
        if (img.publicId) {
          await deleteImage(img.publicId).catch(console.error);
        }
      }
    }
    
    await News.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting news article'
    });
  }
};

// @desc    Update news status (draft, published, archived)
// @route   PATCH /api/news/admin/:id/status
// @access  Private/Admin
const updateNewsStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be draft, published, or archived'
      });
    }
    
    const updateData = { status };
    
    // Set publishDate if publishing for the first time
    if (status === 'published') {
      const news = await News.findById(id);
      if (!news.publishDate || news.status !== 'published') {
        updateData.publishDate = new Date();
      }
    }
    
    const news = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      message: `News article ${status} successfully`,
      data: news
    });
  } catch (error) {
    console.error('Error updating news status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating news status'
    });
  }
};

// @desc    Update news active status
// @route   PATCH /api/news/admin/:id/active
// @access  Private/Admin
const updateNewsActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }
    
    const news = await News.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      message: `News article ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: news
    });
  } catch (error) {
    console.error('Error updating news active status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating news active status'
    });
  }
};

// @desc    Update news display order
// @route   PATCH /api/news/admin/:id/order
// @access  Private/Admin
const updateNewsOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;
    
    if (typeof displayOrder !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'displayOrder must be a number'
      });
    }
    
    const news = await News.findByIdAndUpdate(
      id,
      { displayOrder },
      { new: true, runValidators: true }
    );
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      message: 'News article order updated successfully',
      data: news
    });
  } catch (error) {
    console.error('Error updating news order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating news order'
    });
  }
};

// @desc    Get news statistics for admin dashboard
// @route   GET /api/news/admin/stats
// @access  Private/Admin
const getNewsStats = async (req, res) => {
  try {
    const totalNews = await News.countDocuments();
    const publishedNews = await News.countDocuments({ status: 'published' });
    const draftNews = await News.countDocuments({ status: 'draft' });
    const archivedNews = await News.countDocuments({ status: 'archived' });
    const activeNews = await News.countDocuments({ isActive: true });
    const featuredNews = await News.countDocuments({ isFeatured: true });
    
    // Get categories count
    const categories = await News.distinct('category');
    const categoriesCount = categories.length;
    
    // Recent news (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentNews = await News.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // News by category
    const newsByCategory = await News.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // News by status
    const newsByStatus = await News.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Total views
    const totalViews = await News.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalNews,
        published: publishedNews,
        draft: draftNews,
        archived: archivedNews,
        active: activeNews,
        featured: featuredNews,
        categories: categoriesCount,
        recent: recentNews,
        byCategory: newsByCategory,
        byStatus: newsByStatus,
        totalViews: totalViews[0]?.totalViews || 0
      }
    });
  } catch (error) {
    console.error('Error fetching news stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching news statistics'
    });
  }
};

module.exports = {
  // Public routes
  getNews,
  getNewsBySlug,
  getCategories,
  getTags,
  
  // Admin routes
  getAdminNews,
  getAdminNewsById,
  createNews,
  updateNews,
  deleteNews,
  updateNewsStatus,
  updateNewsActive,
  updateNewsOrder,
  getNewsStats,
};


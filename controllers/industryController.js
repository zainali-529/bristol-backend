const Industry = require('../models/Industry');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get all active industries for public display
// @route   GET /api/industries
// @access  Public
const getIndustries = async (req, res) => {
  try {
    const industries = await Industry.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: industries.length,
      data: industries
    });
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching industries'
    });
  }
};

// @desc    Get all industries for admin (including inactive)
// @route   GET /api/industries/admin
// @access  Private/Admin
const getAdminIndustries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }
    
    // Execute query with pagination
    const industries = await Industry.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Industry.countDocuments(query);
    
    res.json({
      success: true,
      count: industries.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: industries
    });
  } catch (error) {
    console.error('Error fetching admin industries:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching industries'
    });
  }
};

// @desc    Get single industry by ID for admin
// @route   GET /api/industries/admin/:id
// @access  Private/Admin
const getAdminIndustryById = async (req, res) => {
  try {
    const industry = await Industry.findById(req.params.id);
    
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }
    
    res.json({
      success: true,
      data: industry
    });
  } catch (error) {
    console.error('Error fetching industry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching industry'
    });
  }
};

// @desc    Create new industry
// @route   POST /api/industries/admin
// @access  Private/Admin
const createIndustry = async (req, res) => {
  try {
    const { title, description, savings, displayOrder, isActive, sectionTitle, sectionDescription } = req.body;
    
    // Validate required fields
    if (!title || !description || !savings) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and savings are required'
      });
    }
    
    // Handle image upload
    let imageData = {};
    if (req.file) {
      imageData = {
        url: req.file.path,
        publicId: req.file.filename,
        alt: req.body.imageAlt || title
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }
    
    // Create industry
    const industry = await Industry.create({
      title: title.trim(),
      description: description.trim(),
      image: imageData,
      savings: savings.trim(),
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
      sectionTitle: sectionTitle?.trim(),
      sectionDescription: sectionDescription?.trim()
    });
    
    res.status(201).json({
      success: true,
      message: 'Industry created successfully',
      data: industry
    });
  } catch (error) {
    console.error('Error creating industry:', error);
    
    // Clean up uploaded image if creation fails
    if (req.file) {
      await deleteImage(req.file.filename).catch(console.error);
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
      message: 'Server error while creating industry'
    });
  }
};

// @desc    Update industry
// @route   PUT /api/industries/admin/:id
// @access  Private/Admin
const updateIndustry = async (req, res) => {
  try {
    const { title, description, savings, displayOrder, isActive, sectionTitle, sectionDescription } = req.body;
    
    const industry = await Industry.findById(req.params.id);
    
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }
    
    // Handle image upload
    if (req.file) {
      // Delete old image if exists
      if (industry.image && industry.image.publicId) {
        await deleteImage(industry.image.publicId).catch(console.error);
      }
      
      industry.image = {
        url: req.file.path,
        publicId: req.file.filename,
        alt: req.body.imageAlt || industry.image?.alt || industry.title
      };
    }
    
    // Update fields
    if (title !== undefined) industry.title = title.trim();
    if (description !== undefined) industry.description = description.trim();
    if (savings !== undefined) industry.savings = savings.trim();
    if (displayOrder !== undefined) industry.displayOrder = displayOrder;
    if (isActive !== undefined) industry.isActive = isActive;
    if (sectionTitle !== undefined) industry.sectionTitle = sectionTitle?.trim();
    if (sectionDescription !== undefined) industry.sectionDescription = sectionDescription?.trim();
    if (req.body.imageAlt !== undefined) {
      if (industry.image) {
        industry.image.alt = req.body.imageAlt.trim();
      }
    }
    
    await industry.save();
    
    res.json({
      success: true,
      message: 'Industry updated successfully',
      data: industry
    });
  } catch (error) {
    console.error('Error updating industry:', error);
    
    // Clean up uploaded image if update fails
    if (req.file) {
      await deleteImage(req.file.filename).catch(console.error);
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
      message: 'Server error while updating industry'
    });
  }
};

// @desc    Delete industry
// @route   DELETE /api/industries/admin/:id
// @access  Private/Admin
const deleteIndustry = async (req, res) => {
  try {
    const industry = await Industry.findById(req.params.id);
    
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }
    
    // Delete image from Cloudinary
    if (industry.image && industry.image.publicId) {
      await deleteImage(industry.image.publicId).catch(console.error);
    }
    
    await industry.deleteOne();
    
    res.json({
      success: true,
      message: 'Industry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting industry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting industry'
    });
  }
};

// @desc    Update industry status (active/inactive)
// @route   PATCH /api/industries/admin/:id/status
// @access  Private/Admin
const updateIndustryStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }
    
    const industry = await Industry.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }
    
    res.json({
      success: true,
      message: `Industry ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: industry
    });
  } catch (error) {
    console.error('Error updating industry status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating industry status'
    });
  }
};

// @desc    Update industry display order
// @route   PATCH /api/industries/admin/:id/order
// @access  Private/Admin
const updateIndustryOrder = async (req, res) => {
  try {
    const { displayOrder } = req.body;
    
    if (typeof displayOrder !== 'number' || displayOrder < 0) {
      return res.status(400).json({
        success: false,
        message: 'displayOrder must be a non-negative number'
      });
    }
    
    const industry = await Industry.findByIdAndUpdate(
      req.params.id,
      { displayOrder },
      { new: true, runValidators: true }
    );
    
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Industry display order updated successfully',
      data: industry
    });
  } catch (error) {
    console.error('Error updating industry order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating industry order'
    });
  }
};

module.exports = {
  getIndustries,
  getAdminIndustries,
  getAdminIndustryById,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  updateIndustryStatus,
  updateIndustryOrder
};


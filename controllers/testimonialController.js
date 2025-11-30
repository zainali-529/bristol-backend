const Testimonial = require('../models/Testimonial');

// @desc    Get all active testimonials for public display
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching testimonials'
    });
  }
};

// @desc    Get all testimonials for admin (including inactive)
// @route   GET /api/testimonials/admin
// @access  Private/Admin
const getAdminTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { testimonial: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }
    
    // Execute query with pagination
    const testimonials = await Testimonial.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const total = await Testimonial.countDocuments(query);
    
    res.json({
      success: true,
      count: testimonials.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: testimonials
    });
  } catch (error) {
    console.error('Error fetching admin testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching testimonials'
    });
  }
};

// @desc    Get single testimonial by ID for admin
// @route   GET /api/testimonials/admin/:id
// @access  Private/Admin
const getAdminTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id).select('-__v');
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }
    
    res.json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    console.error('Error fetching testimonial by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching testimonial'
    });
  }
};

// @desc    Create a new testimonial
// @route   POST /api/testimonials/admin
// @access  Private/Admin
const createTestimonial = async (req, res) => {
  try {
    const { name, position, company, testimonial, rating, displayOrder, isActive } = req.body;
    
    const newTestimonial = await Testimonial.create({
      name,
      position,
      company,
      testimonial,
      rating: rating || 5,
      displayOrder,
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: newTestimonial
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
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
      message: 'Server error while creating testimonial'
    });
  }
};

// @desc    Update an existing testimonial
// @route   PUT /api/testimonials/admin/:id
// @access  Private/Admin
const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, company, testimonial, rating, displayOrder, isActive } = req.body;
    
    let testimonialDoc = await Testimonial.findById(id);
    if (!testimonialDoc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Testimonial not found' 
      });
    }
    
    // Update fields
    if (name !== undefined) testimonialDoc.name = name;
    if (position !== undefined) testimonialDoc.position = position;
    if (company !== undefined) testimonialDoc.company = company;
    if (testimonial !== undefined) testimonialDoc.testimonial = testimonial;
    if (rating !== undefined) testimonialDoc.rating = rating;
    if (displayOrder !== undefined) testimonialDoc.displayOrder = displayOrder;
    if (isActive !== undefined) testimonialDoc.isActive = isActive;
    
    await testimonialDoc.save();
    
    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      data: testimonialDoc
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
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
      message: 'Server error while updating testimonial'
    });
  }
};

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/admin/:id
// @access  Private/Admin
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({ 
        success: false, 
        message: 'Testimonial not found' 
      });
    }
    
    await testimonial.deleteOne();
    
    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting testimonial'
    });
  }
};

// @desc    Update testimonial status (active/inactive)
// @route   PATCH /api/testimonials/admin/:id/status
// @access  Private/Admin
const updateTestimonialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'isActive must be a boolean value' 
      });
    }
    
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ 
        success: false, 
        message: 'Testimonial not found' 
      });
    }
    
    testimonial.isActive = isActive;
    await testimonial.save();
    
    res.json({
      success: true,
      message: `Testimonial ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: testimonial
    });
  } catch (error) {
    console.error('Error updating testimonial status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating testimonial status'
    });
  }
};

// @desc    Update testimonial display order
// @route   PATCH /api/testimonials/admin/:id/order
// @access  Private/Admin
const updateTestimonialOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;
    
    if (typeof displayOrder !== 'number' || displayOrder < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'displayOrder must be a non-negative number' 
      });
    }
    
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ 
        success: false, 
        message: 'Testimonial not found' 
      });
    }
    
    testimonial.displayOrder = displayOrder;
    await testimonial.save();
    
    res.json({
      success: true,
      message: 'Testimonial order updated successfully',
      data: testimonial
    });
  } catch (error) {
    console.error('Error updating testimonial order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating testimonial order'
    });
  }
};

// @desc    Get testimonial statistics
// @route   GET /api/testimonials/admin/stats
// @access  Private/Admin
const getTestimonialStats = async (req, res) => {
  try {
    const total = await Testimonial.countDocuments();
    const active = await Testimonial.countDocuments({ isActive: true });
    const inactive = total - active;
    
    res.json({
      success: true,
      data: { total, active, inactive }
    });
  } catch (error) {
    console.error('Error fetching testimonial stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching testimonial stats'
    });
  }
};

module.exports = {
  getTestimonials,
  getAdminTestimonials,
  getAdminTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateTestimonialStatus,
  updateTestimonialOrder,
  getTestimonialStats
};


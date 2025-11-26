const TeamMember = require('../models/TeamMember');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get all active team members (Public)
// @route   GET /api/team-members
// @access  Public
const getActiveTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('name position description image socialLinks displayOrder');
    
    res.json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
    });
  } catch (error) {
    console.error('Error fetching active team members:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team members'
    });
  }
};

// @desc    Get team member by ID (Public)
// @route   GET /api/team-members/:id
// @access  Public
const getTeamMemberById = async (req, res) => {
  try {
    const teamMember = await TeamMember.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    res.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error('Error fetching team member by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team member'
    });
  }
};

// @desc    Get team members statistics (Admin)
// @route   GET /api/team-members/admin/stats
// @access  Private/Admin
const getTeamMemberStats = async (req, res) => {
  try {
    const totalMembers = await TeamMember.countDocuments();
    const activeMembers = await TeamMember.countDocuments({ isActive: true });
    const inactiveMembers = await TeamMember.countDocuments({ isActive: false });
    
    // Recent members (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMembers = await TeamMember.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.json({
      success: true,
      data: {
        total: totalMembers,
        active: activeMembers,
        inactive: inactiveMembers,
        recent: recentMembers
      }
    });
  } catch (error) {
    console.error('Error fetching team member stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};

// @desc    Get all team members with pagination and filters (Admin)
// @route   GET /api/team-members/admin
// @access  Private/Admin
const getAllTeamMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Status filter
    if (req.query.status) {
      filter.isActive = req.query.status === 'active';
    }
    
    // Search filter
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { position: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Sort options
    let sortOption = { displayOrder: 1, createdAt: -1 };
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortOption = { [sortField]: sortOrder };
    }
    
    const teamMembers = await TeamMember.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    const total = await TeamMember.countDocuments(filter);
    
    res.json({
      success: true,
      count: teamMembers.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: teamMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team members'
    });
  }
};

// @desc    Get team member by ID (Admin)
// @route   GET /api/team-members/admin/:id
// @access  Private/Admin
const getTeamMemberByIdAdmin = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    res.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error('Error fetching team member by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team member'
    });
  }
};

// @desc    Create new team member (Admin)
// @route   POST /api/team-members/admin
// @access  Private/Admin
const createTeamMember = async (req, res) => {
  try {
    const { name, position, description, linkedin, email, twitter, website, isActive, displayOrder } = req.body;
    
    // Check if team member with same name exists
    const existingMember = await TeamMember.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Team member with this name already exists'
      });
    }
    
    // Handle image upload (Cloudinary storage)
    let imageData = {};
    if (req.file) {
      imageData = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public ID
        alt: name
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Team member image is required'
      });
    }
    
    // Build social links object
    const socialLinks = {};
    if (linkedin) socialLinks.linkedin = linkedin;
    if (email) socialLinks.email = email;
    if (twitter) socialLinks.twitter = twitter;
    if (website) socialLinks.website = website;
    
    // Create team member
    const teamMemberData = {
      name,
      position,
      description,
      image: imageData,
      socialLinks,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0
    };
    
    const teamMember = await TeamMember.create(teamMemberData);
    
    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: teamMember
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    
    // Handle validation errors
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
      message: 'Server error while creating team member'
    });
  }
};

// @desc    Update team member (Admin)
// @route   PUT /api/team-members/admin/:id
// @access  Private/Admin
const updateTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    const { name, position, description, linkedin, email, twitter, website, isActive, displayOrder } = req.body;
    
    // Check if another team member with same name exists
    if (name && name !== teamMember.name) {
      const existingMember = await TeamMember.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'Team member with this name already exists'
        });
      }
    }
    
    // Handle image update (Cloudinary storage)
    let imageData = teamMember.image;
    if (req.file) {
      // Delete old image from Cloudinary
      if (teamMember.image.publicId) {
        await deleteImage(teamMember.image.publicId).catch(console.error);
      }
      
      // Use new image data from Cloudinary storage
      imageData = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public ID
        alt: name || teamMember.name
      };
    }
    
    // Build social links object
    const socialLinks = { ...teamMember.socialLinks };
    if (linkedin !== undefined) socialLinks.linkedin = linkedin || null;
    if (email !== undefined) socialLinks.email = email || null;
    if (twitter !== undefined) socialLinks.twitter = twitter || null;
    if (website !== undefined) socialLinks.website = website || null;
    
    // Update team member
    const updateData = {
      image: imageData,
      socialLinks
    };
    
    if (name) updateData.name = name;
    if (position) updateData.position = position;
    if (description) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
    
    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: updatedTeamMember
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    
    // Handle validation errors
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
      message: 'Server error while updating team member'
    });
  }
};

// @desc    Delete team member (Admin)
// @route   DELETE /api/team-members/admin/:id
// @access  Private/Admin
const deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    // Delete image from Cloudinary
    if (teamMember.image.publicId) {
      await deleteImage(teamMember.image.publicId).catch(console.error);
    }
    
    await TeamMember.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting team member'
    });
  }
};

// @desc    Update team member status (Admin)
// @route   PATCH /api/team-members/admin/:id/status
// @access  Private/Admin
const updateTeamMemberStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }
    
    const teamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    res.json({
      success: true,
      message: `Team member ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: teamMember
    });
  } catch (error) {
    console.error('Error updating team member status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating team member status'
    });
  }
};

// @desc    Update team member display order (Admin)
// @route   PATCH /api/team-members/admin/:id/order
// @access  Private/Admin
const updateTeamMemberOrder = async (req, res) => {
  try {
    const { displayOrder } = req.body;
    
    if (displayOrder === undefined || isNaN(displayOrder) || displayOrder < 0) {
      return res.status(400).json({
        success: false,
        message: 'displayOrder must be a non-negative number'
      });
    }
    
    const teamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { displayOrder: parseInt(displayOrder) },
      { new: true, runValidators: true }
    );
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Team member display order updated successfully',
      data: teamMember
    });
  } catch (error) {
    console.error('Error updating team member order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating team member order'
    });
  }
};

module.exports = {
  // Public routes
  getActiveTeamMembers,
  getTeamMemberById,
  
  // Admin routes
  getAllTeamMembers,
  getTeamMemberByIdAdmin,
  getTeamMemberStats,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  updateTeamMemberStatus,
  updateTeamMemberOrder
};


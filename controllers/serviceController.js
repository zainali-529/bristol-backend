const Service = require('../models/Service');
const { deleteImage, extractPublicId } = require('../config/cloudinary');

// @desc    Get all active services for public display (cards)
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { featured } = req.query;
    
    let services;
    if (featured === 'true') {
      services = await Service.getFeaturedServices();
    } else {
      services = await Service.getActiveServices();
    }
    
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services'
    });
  }
};

// @desc    Get single service by slug for public display (detail page)
// @route   GET /api/services/:slug
// @access  Public
const getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const service = await Service.findOne({ 
      slug: slug, 
      isActive: true 
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: service.getDetailData()
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching service'
    });
  }
};

// @desc    Get all services for admin (including inactive)
// @route   GET /api/services/admin
// @access  Private/Admin
const getAdminServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { cardDescription: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }
    
    // Execute query with pagination
    const services = await Service.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Service.countDocuments(query);
    
    res.json({
      success: true,
      count: services.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: services
    });
  } catch (error) {
    console.error('Error fetching admin services:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services'
    });
  }
};

// @desc    Get single service by ID for admin
// @route   GET /api/services/admin/:id
// @access  Private/Admin
const getAdminServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching service'
    });
  }
};

// @desc    Create new service
// @route   POST /api/services/admin
// @access  Private/Admin
const createService = async (req, res) => {
  try {
    const serviceData = { ...req.body };
    
    // Handle main image from multer/cloudinary
    if (req.files && req.files.mainImage) {
      serviceData.mainImage = {
        url: req.files.mainImage[0].path,
        publicId: req.files.mainImage[0].filename,
        alt: req.body.mainImageAlt || ''
      };
    }
    
    // Handle secondary images
    if (req.files && req.files.secondaryImages) {
      serviceData.secondaryImages = req.files.secondaryImages.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        alt: req.body[`secondaryImageAlt${index}`] || '',
        caption: req.body[`secondaryImageCaption${index}`] || '',
        order: index
      }));
    }
    
    // Parse JSON fields if they come as strings
    if (typeof serviceData.servicesInclude === 'string') {
      serviceData.servicesInclude = JSON.parse(serviceData.servicesInclude);
    }
    if (typeof serviceData.expertise === 'string') {
      serviceData.expertise = JSON.parse(serviceData.expertise);
    }
    if (typeof serviceData.servicesBenefits === 'string') {
      serviceData.servicesBenefits = JSON.parse(serviceData.servicesBenefits);
    }
    
    const service = new Service(serviceData);
    await service.save();
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    
    // Clean up uploaded images if service creation fails
    if (req.files) {
      if (req.files.mainImage) {
        await deleteImage(req.files.mainImage[0].filename).catch(console.error);
      }
      if (req.files.secondaryImages) {
        for (const file of req.files.secondaryImages) {
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
        message: 'Service with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating service'
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/admin/:id
// @access  Private/Admin
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Handle main image update
    if (req.files && req.files.mainImage) {
      // Delete old main image
      if (service.mainImage && service.mainImage.publicId) {
        await deleteImage(service.mainImage.publicId).catch(console.error);
      }
      
      updateData.mainImage = {
        url: req.files.mainImage[0].path,
        publicId: req.files.mainImage[0].filename,
        alt: req.body.mainImageAlt || service.mainImage?.alt || ''
      };
    }
    
    // Handle secondary images update
    if (req.files && req.files.secondaryImages) {
      // Delete old secondary images
      if (service.secondaryImages && service.secondaryImages.length > 0) {
        for (const img of service.secondaryImages) {
          if (img.publicId) {
            await deleteImage(img.publicId).catch(console.error);
          }
        }
      }
      
      updateData.secondaryImages = req.files.secondaryImages.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        alt: req.body[`secondaryImageAlt${index}`] || '',
        caption: req.body[`secondaryImageCaption${index}`] || '',
        order: index
      }));
    }
    
    // Parse JSON fields if they come as strings
    if (typeof updateData.servicesInclude === 'string') {
      updateData.servicesInclude = JSON.parse(updateData.servicesInclude);
    }
    if (typeof updateData.expertise === 'string') {
      updateData.expertise = JSON.parse(updateData.expertise);
    }
    if (typeof updateData.servicesBenefits === 'string') {
      updateData.servicesBenefits = JSON.parse(updateData.servicesBenefits);
    }
    
    const updatedService = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    
    // Clean up uploaded images if update fails
    if (req.files) {
      if (req.files.mainImage) {
        await deleteImage(req.files.mainImage[0].filename).catch(console.error);
      }
      if (req.files.secondaryImages) {
        for (const file of req.files.secondaryImages) {
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
      message: 'Server error while updating service'
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/admin/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Delete main image from Cloudinary
    if (service.mainImage && service.mainImage.publicId) {
      await deleteImage(service.mainImage.publicId).catch(console.error);
    }
    
    // Delete secondary images from Cloudinary
    if (service.secondaryImages && service.secondaryImages.length > 0) {
      for (const img of service.secondaryImages) {
        if (img.publicId) {
          await deleteImage(img.publicId).catch(console.error);
        }
      }
    }
    
    await Service.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting service'
    });
  }
};

// @desc    Update service status (active/inactive)
// @route   PATCH /api/services/admin/:id/status
// @access  Private/Admin
const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }
    
    const service = await Service.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: service
    });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating service status'
    });
  }
};

// @desc    Update service display order
// @route   PATCH /api/services/admin/:id/order
// @access  Private/Admin
const updateServiceOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;
    
    if (typeof displayOrder !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'displayOrder must be a number'
      });
    }
    
    const service = await Service.findByIdAndUpdate(
      id,
      { displayOrder },
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service order updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Error updating service order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating service order'
    });
  }
};

// @desc    Get service statistics for admin dashboard
// @route   GET /api/services/admin/stats
// @access  Private/Admin
const getServiceStats = async (req, res) => {
  try {
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ isActive: true });
    const inactiveServices = await Service.countDocuments({ isActive: false });
    const featuredServices = await Service.countDocuments({ isFeatured: true });
    
    // Recent services (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentServices = await Service.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.json({
      success: true,
      data: {
        total: totalServices,
        active: activeServices,
        inactive: inactiveServices,
        featured: featuredServices,
        recent: recentServices
      }
    });
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching service statistics'
    });
  }
};

module.exports = {
  getServices,
  getServiceBySlug,
  getAdminServices,
  getAdminServiceById,
  createService,
  updateService,
  deleteService,
  updateServiceStatus,
  updateServiceOrder,
  getServiceStats
};
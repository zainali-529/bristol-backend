const Supplier = require('../models/Supplier');
const cloudinary = require('../config/cloudinary');

// @desc    Get all active suppliers (Public)
// @route   GET /api/suppliers
// @access  Public
const getActiveSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.getActiveSuppliers();
    
    const suppliersData = suppliers.map(supplier => supplier.getPublicData());
    
    res.json({
      success: true,
      count: suppliersData.length,
      data: suppliersData
    });
  } catch (error) {
    console.error('Error fetching active suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suppliers'
    });
  }
};

// @desc    Get supplier by slug (Public)
// @route   GET /api/suppliers/:slug
// @access  Public
const getSupplierBySlug = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      data: supplier.getPublicData()
    });
  } catch (error) {
    console.error('Error fetching supplier by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supplier'
    });
  }
};

// @desc    Get suppliers statistics (Admin)
// @route   GET /api/suppliers/admin/stats
// @access  Private/Admin
const getSupplierStats = async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ isActive: true });
    const inactiveSuppliers = await Supplier.countDocuments({ isActive: false });
    
    // Recent suppliers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSuppliers = await Supplier.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.json({
      success: true,
      data: {
        total: totalSuppliers,
        active: activeSuppliers,
        inactive: inactiveSuppliers,
        recent: recentSuppliers
      }
    });
  } catch (error) {
    console.error('Error fetching supplier stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};

// @desc    Get all suppliers with pagination and filters (Admin)
// @route   GET /api/suppliers/admin
// @access  Private/Admin
const getAllSuppliers = async (req, res) => {
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
    
    const suppliers = await Supplier.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    const total = await Supplier.countDocuments(filter);
    
    res.json({
      success: true,
      count: suppliers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suppliers'
    });
  }
};

// @desc    Get supplier by ID (Admin)
// @route   GET /api/suppliers/admin/:id
// @access  Private/Admin
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supplier'
    });
  }
};

// @desc    Create new supplier (Admin)
// @route   POST /api/suppliers/admin
// @access  Private/Admin
const createSupplier = async (req, res) => {
  try {
    const { name, description, websiteUrl, isActive, displayOrder, metaTitle, metaDescription } = req.body;
    
    // Check if supplier with same name exists
    const existingSupplier = await Supplier.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this name already exists'
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
        message: 'Supplier image is required'
      });
    }
    
    // Create supplier
    const supplierData = {
      name,
      description,
      websiteUrl,
      image: imageData,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0
    };
    
    if (metaTitle) supplierData.metaTitle = metaTitle;
    if (metaDescription) supplierData.metaDescription = metaDescription;
    
    const supplier = await Supplier.create(supplierData);
    
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating supplier'
    });
  }
};

// @desc    Update supplier (Admin)
// @route   PUT /api/suppliers/admin/:id
// @access  Private/Admin
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    const { name, description, websiteUrl, isActive, displayOrder, metaTitle, metaDescription } = req.body;
    
    // Check if another supplier with same name exists
    if (name && name !== supplier.name) {
      const existingSupplier = await Supplier.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'Supplier with this name already exists'
        });
      }
    }
    
    // Handle image update (Cloudinary storage)
    let imageData = supplier.image;
    if (req.file) {
      // Delete old image from Cloudinary
      if (supplier.image.publicId) {
        await cloudinary.uploader.destroy(supplier.image.publicId);
      }
      
      // Use new image data from Cloudinary storage
      imageData = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public ID
        alt: name || supplier.name
      };
    }
    
    // Update supplier
    const updateData = {
      image: imageData
    };
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (websiteUrl) updateData.websiteUrl = websiteUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating supplier'
    });
  }
};

// @desc    Delete supplier (Admin)
// @route   DELETE /api/suppliers/admin/:id
// @access  Private/Admin
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Delete image from Cloudinary
    if (supplier.image.publicId) {
      try {
        await cloudinary.uploader.destroy(supplier.image.publicId);
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError);
      }
    }
    
    await Supplier.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting supplier'
    });
  }
};

// @desc    Update supplier status (Admin)
// @route   PATCH /api/suppliers/admin/:id/status
// @access  Private/Admin
const updateSupplierStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      message: `Supplier ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating supplier status'
    });
  }
};

// @desc    Update supplier display order (Admin)
// @route   PATCH /api/suppliers/admin/:id/order
// @access  Private/Admin
const updateSupplierOrder = async (req, res) => {
  try {
    const { displayOrder } = req.body;
    
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { displayOrder },
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Supplier display order updated successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating supplier order'
    });
  }
};

module.exports = {
  // Public routes
  getActiveSuppliers,
  getSupplierBySlug,
  
  // Admin routes
  getSupplierStats,
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  updateSupplierStatus,
  updateSupplierOrder
};
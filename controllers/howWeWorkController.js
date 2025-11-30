const HowWeWork = require('../models/HowWeWork');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get active work steps for public display (landing page)
// @route   GET /api/how-we-work
// @access  Public
const getWorkSteps = async (req, res) => {
  try {
    const steps = await HowWeWork.getActiveSteps();
    
    res.json({
      success: true,
      count: steps.length,
      data: steps
    });
  } catch (error) {
    console.error('Error fetching work steps:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching work steps'
    });
  }
};

// @desc    Get work steps document for admin
// @route   GET /api/how-we-work/admin
// @access  Private/Admin
const getAdminWorkSteps = async (req, res) => {
  try {
    const doc = await HowWeWork.getSingle();
    
    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    console.error('Error fetching admin work steps:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching work steps'
    });
  }
};

// @desc    Update work steps (all 3 steps)
// @route   PUT /api/how-we-work/admin
// @access  Private/Admin
const updateWorkSteps = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Get the single document
    let doc = await HowWeWork.getSingle();
    
    // Parse steps if it comes as a string (from multipart form data)
    let steps = updateData.steps;
    if (typeof steps === 'string') {
      steps = JSON.parse(steps);
    }
    
    // Validate steps array
    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        message: 'Steps array is required'
      });
    }
    
    if (steps.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 4 steps are required'
      });
    }
    
    // Handle image uploads from req.files
    if (req.files) {
      for (let i = 0; i < 4; i++) {
        const fieldName = `stepImage${i + 1}`;
        if (req.files[fieldName]) {
          // Delete old image if exists
          if (doc.steps[i] && doc.steps[i].image && doc.steps[i].image.publicId) {
            await deleteImage(doc.steps[i].image.publicId).catch(console.error);
          }
          
          steps[i].image = {
            url: req.files[fieldName][0].path,
            publicId: req.files[fieldName][0].filename,
            alt: steps[i].image?.alt || ''
          };
        } else if (doc.steps[i] && doc.steps[i].image) {
          // Keep existing image if no new upload
          steps[i].image = doc.steps[i].image;
        }
      }
    } else {
      // If no files uploaded, keep existing images
      for (let i = 0; i < 4; i++) {
        if (!steps[i].image && doc.steps[i] && doc.steps[i].image) {
          steps[i].image = doc.steps[i].image;
        }
      }
    }
    
    // Validate each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      if (!step.image || !step.image.url) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1}: Image is required`
        });
      }
      
      if (!step.title || !step.description) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1}: Title and description are required`
        });
      }
      
      if (step.title.length > 100) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1}: Title cannot exceed 100 characters`
        });
      }
      
      if (step.description.length > 300) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1}: Description cannot exceed 300 characters`
        });
      }
    }
    
    // Update steps with proper order
    doc.steps = steps.map((step, index) => ({
      image: step.image,
      title: step.title.trim(),
      description: step.description.trim(),
      icon: step.icon ? step.icon.trim() : undefined, // Icon is optional
      order: index + 1
    }));
    
    // Update status if provided
    if (typeof updateData.isActive === 'boolean') {
      doc.isActive = updateData.isActive;
    }
    
    await doc.save();
    
    res.json({
      success: true,
      message: 'Work steps updated successfully',
      data: doc
    });
  } catch (error) {
    console.error('Error updating work steps:', error);
    
    // Clean up uploaded images if update fails
    if (req.files) {
      for (let i = 1; i <= 4; i++) {
        const fieldName = `stepImage${i}`;
        if (req.files[fieldName]) {
          await deleteImage(req.files[fieldName][0].filename).catch(console.error);
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
      message: 'Server error while updating work steps'
    });
  }
};

// @desc    Update single step by order (1, 2, or 3)
// @route   PATCH /api/how-we-work/admin/step/:order
// @access  Private/Admin
const updateSingleStep = async (req, res) => {
  try {
    const { order } = req.params;
    const { title, description, icon } = req.body;
    
    // Validate order
    const stepOrder = parseInt(order);
    if (isNaN(stepOrder) || stepOrder < 1 || stepOrder > 4) {
      return res.status(400).json({
        success: false,
        message: 'Order must be 1, 2, 3, or 4'
      });
    }
    
    // Get the single document
    let doc = await HowWeWork.getSingle();
    
    // Find the specific step
    const stepIndex = doc.steps.findIndex(s => s.order === stepOrder);
    
    if (stepIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Step with order ${stepOrder} not found`
      });
    }
    
    // Handle image upload
    if (req.file) {
      // Delete old image if exists
      if (doc.steps[stepIndex].image && doc.steps[stepIndex].image.publicId) {
        await deleteImage(doc.steps[stepIndex].image.publicId).catch(console.error);
      }
      
      doc.steps[stepIndex].image = {
        url: req.file.path,
        publicId: req.file.filename,
        alt: req.body.imageAlt || doc.steps[stepIndex].image?.alt || ''
      };
    }
    
    // Update step fields
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty'
        });
      }
      if (title.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 100 characters'
        });
      }
      doc.steps[stepIndex].title = title.trim();
    }
    
    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot be empty'
        });
      }
      if (description.length > 300) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 300 characters'
        });
      }
      doc.steps[stepIndex].description = description.trim();
    }
    
    if (icon !== undefined) {
      if (icon && icon.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Icon name cannot exceed 50 characters'
        });
      }
      doc.steps[stepIndex].icon = icon ? icon.trim() : undefined;
    }
    
    await doc.save();
    
    res.json({
      success: true,
      message: `Step ${stepOrder} updated successfully`,
      data: doc
    });
  } catch (error) {
    console.error('Error updating single step:', error);
    
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
      message: 'Server error while updating step'
    });
  }
};

// @desc    Update status (active/inactive)
// @route   PATCH /api/how-we-work/admin/status
// @access  Private/Admin
const updateStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }
    
    let doc = await HowWeWork.getSingle();
    doc.isActive = isActive;
    await doc.save();
    
    res.json({
      success: true,
      message: `How We Work section ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: doc
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
};

module.exports = {
  getWorkSteps,
  getAdminWorkSteps,
  updateWorkSteps,
  updateSingleStep,
  updateStatus
};


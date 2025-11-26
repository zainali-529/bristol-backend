const Theme = require('../models/Theme');
const { validationResult } = require('express-validator');
const { isValidHexColor, normalizeHexColor, generateColorVariations } = require('../utils/colorUtils');
const { cloudinary } = require('../config/cloudinary');

// ======================
// PUBLIC ROUTES
// ======================

// @desc    Get active theme
// @route   GET /api/theme
// @access  Public
const getActiveTheme = async (req, res) => {
  try {
    const theme = await Theme.getActiveTheme();

    if (!theme) {
      // Return default theme if none exists
      const defaultVariations = generateColorVariations('#AE613A');
      const defaultBorderRadius = {
        md: '0.5rem',
        sm: '0.25rem',
        lg: '0.75rem',
        xl: '1rem',
      };
      
      // Generate CSS variables manually for default theme
      const defaultCSSVars = {
        '--primary': defaultVariations.primary,
        '--primary-100': defaultVariations.primary100,
        '--primary-80': defaultVariations.primary80,
        '--primary-60': defaultVariations.primary60,
        '--primary-40': defaultVariations.primary40,
        '--primary-30': defaultVariations.primary30,
        '--primary-20': defaultVariations.primary20,
        '--primary-10': defaultVariations.primary10,
        '--primary-5': defaultVariations.primary5,
        '--primary-foreground': '#ffffff',
        '--ring': defaultVariations.primary,
        '--radius': defaultBorderRadius.md,
        '--radius-sm': defaultBorderRadius.sm,
        '--radius-lg': defaultBorderRadius.lg,
        '--radius-xl': defaultBorderRadius.xl,
      };
      
      return res.status(200).json({
        success: true,
        data: {
          primaryColor: '#AE613A',
          colorVariations: defaultVariations,
          typography: {
            fontFamily: 'Poppins, system-ui, Avenir, Helvetica, Arial, sans-serif',
            fontSize: {
              base: '16px',
              small: '14px',
              large: '18px',
              xlarge: '24px',
            },
          },
          borderRadius: {
            sm: '0.25rem',
            md: '0.5rem',
            lg: '0.75rem',
            xl: '1rem',
          },
          cssVariables: defaultCSSVars
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        colorVariations: theme.colorVariations,
        typography: theme.typography,
        spacing: theme.spacing,
        borderRadius: theme.borderRadius,
        branding: theme.branding,
        darkMode: theme.darkMode,
        cssVariables: theme.toCSSVariables(),
        version: theme.version,
        updatedAt: theme.updatedAt
      }
    });
  } catch (error) {
    console.error('Get active theme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch theme'
    });
  }
};

// ======================
// ADMIN ROUTES
// ======================

// @desc    Get all themes
// @route   GET /api/admin/themes
// @access  Private (Admin)
const getAllThemes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const themes = await Theme.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Theme.countDocuments();

    res.status(200).json({
      success: true,
      data: themes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get all themes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch themes'
    });
  }
};

// @desc    Get theme by ID
// @route   GET /api/admin/themes/:id
// @access  Private (Admin)
const getThemeById = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);

    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }

    res.status(200).json({
      success: true,
      data: theme
    });
  } catch (error) {
    console.error('Get theme by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch theme'
    });
  }
};

// @desc    Create or update theme
// @route   POST /api/admin/themes
// @access  Private (Admin)
const createOrUpdateTheme = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      primaryColor,
      secondaryColor,
      accentColor,
      typography,
      spacing,
      borderRadius,
      branding,
      darkMode,
      isActive
    } = req.body;

    // Get current active theme or create new
    let theme = await Theme.findOne({ isActive: true });

    if (theme) {
      // Update existing theme
      if (primaryColor) {
        theme.primaryColor = normalizeHexColor(primaryColor);
        // Color variations will be auto-generated in pre-save hook
      }
      if (secondaryColor !== undefined) theme.secondaryColor = secondaryColor ? normalizeHexColor(secondaryColor) : null;
      if (accentColor !== undefined) theme.accentColor = accentColor ? normalizeHexColor(accentColor) : null;
      if (typography) theme.typography = { ...theme.typography, ...typography };
      if (spacing) theme.spacing = { ...theme.spacing, ...spacing };
      if (borderRadius) theme.borderRadius = { ...theme.borderRadius, ...borderRadius };
      if (branding) theme.branding = { ...theme.branding, ...branding };
      if (darkMode) theme.darkMode = { ...theme.darkMode, ...darkMode };
      if (isActive !== undefined) theme.isActive = isActive;
      
      theme.version = (theme.version || 1) + 1;
    } else {
      // Create new theme
      theme = new Theme({
        primaryColor: normalizeHexColor(primaryColor || '#AE613A'),
        secondaryColor: secondaryColor ? normalizeHexColor(secondaryColor) : null,
        accentColor: accentColor ? normalizeHexColor(accentColor) : null,
        typography: typography || {},
        spacing: spacing || {},
        borderRadius: borderRadius || {},
        branding: branding || {},
        darkMode: darkMode || { enabled: true },
        isActive: isActive !== undefined ? isActive : true
      });
    }

    await theme.save();

    res.status(200).json({
      success: true,
      message: 'Theme updated successfully',
      data: {
        ...theme.toObject(),
        cssVariables: theme.toCSSVariables()
      }
    });
  } catch (error) {
    console.error('Create/update theme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update theme',
      error: error.message
    });
  }
};

// @desc    Update primary color only
// @route   PUT /api/admin/themes/primary-color
// @access  Private (Admin)
const updatePrimaryColor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { primaryColor } = req.body;

    let theme = await Theme.findOne({ isActive: true });

    if (!theme) {
      theme = new Theme({
        primaryColor: normalizeHexColor(primaryColor),
        isActive: true
      });
    } else {
      theme.primaryColor = normalizeHexColor(primaryColor);
      theme.version = (theme.version || 1) + 1;
    }

    await theme.save();

    res.status(200).json({
      success: true,
      message: 'Primary color updated successfully',
      data: {
        primaryColor: theme.primaryColor,
        colorVariations: theme.colorVariations,
        cssVariables: theme.toCSSVariables()
      }
    });
  } catch (error) {
    console.error('Update primary color error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update primary color'
    });
  }
};

// @desc    Delete theme
// @route   DELETE /api/admin/themes/:id
// @access  Private (Admin)
const deleteTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);

    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }

    // Don't allow deleting active theme
    if (theme.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active theme. Please deactivate it first.'
      });
    }

    await theme.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Theme deleted successfully'
    });
  } catch (error) {
    console.error('Delete theme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete theme'
    });
  }
};

// @desc    Reset theme to default
// @route   POST /api/admin/themes/reset
// @access  Private (Admin)
const resetTheme = async (req, res) => {
  try {
    let theme = await Theme.findOne({ isActive: true });

    if (!theme) {
      theme = new Theme({
        primaryColor: '#AE613A',
        isActive: true
      });
    } else {
      theme.primaryColor = '#AE613A';
      theme.secondaryColor = null;
      theme.accentColor = null;
      theme.typography = {
        fontFamily: 'Poppins, system-ui, Avenir, Helvetica, Arial, sans-serif',
        fontSize: {
          base: '16px',
          small: '14px',
          large: '18px',
          xlarge: '24px',
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
      };
      theme.borderRadius = {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      };
      theme.version = (theme.version || 1) + 1;
    }

    await theme.save();

    res.status(200).json({
      success: true,
      message: 'Theme reset to default successfully',
      data: {
        ...theme.toObject(),
        cssVariables: theme.toCSSVariables()
      }
    });
  } catch (error) {
    console.error('Reset theme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset theme'
    });
  }
};

// @desc    Upload logo
// @route   POST /api/admin/themes/upload-logo
// @access  Private (Admin)
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📤 Logo upload details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      filename: req.file.filename
    });

    let theme = await Theme.findOne({ isActive: true });

    if (!theme) {
      theme = new Theme({
        primaryColor: '#AE613A',
        isActive: true
      });
    }

    // Delete old logo from Cloudinary if exists
    if (theme.branding?.logoUrl) {
      try {
        const oldLogoUrl = theme.branding.logoUrl;
        // Extract public ID from URL (handles both image and raw resource types)
        let publicId = oldLogoUrl.split('/').slice(-2).join('/').split('.')[0];
        
        // Determine resource type based on URL or file extension
        const isSVG = oldLogoUrl.toLowerCase().includes('.svg') || oldLogoUrl.toLowerCase().includes('/raw/');
        const resourceType = isSVG ? 'raw' : 'image';
        
        // Delete from Cloudinary with appropriate resource type
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`✅ Deleted old logo (resource_type: ${resourceType})`);
      } catch (error) {
        console.error('Error deleting old logo:', error);
        // Continue even if deletion fails
      }
    }

    // Update logo URL
    // For SVG files stored as raw, ensure URL has .svg extension
    let logoUrl = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    if (fileExtension === 'svg' && !logoUrl.toLowerCase().includes('.svg')) {
      // Add .svg extension if missing (Cloudinary raw URLs sometimes don't include extension)
      logoUrl = logoUrl.replace(/\?.*$/, '') + '.svg';
    }

    if (!theme.branding) {
      theme.branding = {};
    }
    theme.branding.logoUrl = logoUrl;
    theme.version = (theme.version || 1) + 1;

    await theme.save();

    console.log('✅ Logo saved successfully:', logoUrl);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoUrl: theme.branding.logoUrl
      }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: error.message
    });
  }
};

// @desc    Upload favicon
// @route   POST /api/admin/themes/upload-favicon
// @access  Private (Admin)
const uploadFavicon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let theme = await Theme.findOne({ isActive: true });

    if (!theme) {
      theme = new Theme({
        primaryColor: '#AE613A',
        isActive: true
      });
    }

    // Delete old favicon from Cloudinary if exists
    if (theme.branding?.faviconUrl) {
      try {
        const publicId = theme.branding.faviconUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting old favicon:', error);
      }
    }

    // Update favicon URL
    if (!theme.branding) {
      theme.branding = {};
    }
    theme.branding.faviconUrl = req.file.path;
    theme.version = (theme.version || 1) + 1;

    await theme.save();

    res.status(200).json({
      success: true,
      message: 'Favicon uploaded successfully',
      data: {
        faviconUrl: theme.branding.faviconUrl
      }
    });
  } catch (error) {
    console.error('Upload favicon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload favicon'
    });
  }
};

// @desc    Delete logo
// @route   DELETE /api/admin/themes/logo
// @access  Private (Admin)
const deleteLogo = async (req, res) => {
  try {
    const theme = await Theme.findOne({ isActive: true });

    if (!theme || !theme.branding?.logoUrl) {
      return res.status(404).json({
        success: false,
        message: 'Logo not found'
      });
    }

    // Delete from Cloudinary
    try {
      const logoUrl = theme.branding.logoUrl;
      let publicId = logoUrl.split('/').slice(-2).join('/').split('.')[0];
      
      // Determine resource type (SVG files are stored as 'raw')
      const isSVG = logoUrl.toLowerCase().includes('.svg') || logoUrl.toLowerCase().includes('/raw/');
      const resourceType = isSVG ? 'raw' : 'image';
      
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`✅ Deleted logo from Cloudinary (resource_type: ${resourceType})`);
    } catch (error) {
      console.error('Error deleting logo from Cloudinary:', error);
    }

    // Remove from database
    theme.branding.logoUrl = null;
    theme.version = (theme.version || 1) + 1;
    await theme.save();

    res.status(200).json({
      success: true,
      message: 'Logo deleted successfully'
    });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete logo'
    });
  }
};

// @desc    Delete favicon
// @route   DELETE /api/admin/themes/favicon
// @access  Private (Admin)
const deleteFavicon = async (req, res) => {
  try {
    const theme = await Theme.findOne({ isActive: true });

    if (!theme || !theme.branding?.faviconUrl) {
      return res.status(404).json({
        success: false,
        message: 'Favicon not found'
      });
    }

    // Delete from Cloudinary
    try {
      const publicId = theme.branding.faviconUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting favicon from Cloudinary:', error);
    }

    // Remove from database
    theme.branding.faviconUrl = null;
    theme.version = (theme.version || 1) + 1;
    await theme.save();

    res.status(200).json({
      success: true,
      message: 'Favicon deleted successfully'
    });
  } catch (error) {
    console.error('Delete favicon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete favicon'
    });
  }
};

module.exports = {
  // Public routes
  getActiveTheme,
  
  // Admin routes
  getAllThemes,
  getThemeById,
  createOrUpdateTheme,
  updatePrimaryColor,
  deleteTheme,
  resetTheme,
  uploadLogo,
  uploadFavicon,
  deleteLogo,
  deleteFavicon,
};


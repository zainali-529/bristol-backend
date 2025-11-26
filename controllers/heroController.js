const Hero = require('../models/Hero');
const { validationResult } = require('express-validator');
const { deleteHeroVideo, deleteHeroImage } = require('../config/cloudinaryHero');

// @desc    Get active hero configuration (public)
// @route   GET /api/hero/active
// @access  Public
const getActiveHero = async (req, res) => {
  try {
    const hero = await Hero.getActiveHero();
    
    if (!hero) {
      // Return default configuration if no active hero
      return res.json({
        success: true,
        data: {
          badgeLabel: "Powering UK's Businesses",
          headline: 'We power your business with the best energy deals',
          subheadline: "Orca Business Solutions is a new name, but we're built on real experience.",
          primaryCta: { label: 'Explore Us', link: '/about' },
          secondaryCta: { label: 'Contact Us', link: '/contact' },
          background: {
            type: 'video',
            videoUrl: '/videos/hero-bg-video.mp4',
            overlay: false,
            overlayOpacity: 40
          },
          particles: {
            enabled: true,
            count: 80,
            color: '#ffffff',
            size: 3,
            speed: 2,
            lineColor: '#ffffff',
            lineOpacity: 0.4,
            interactivity: true
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: hero
    });
  } catch (error) {
    console.error('Error fetching active hero:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hero configuration'
    });
  }
};

// @desc    Get hero stats
// @route   GET /api/hero/admin/stats
// @access  Private/Admin
const getHeroStats = async (req, res) => {
  try {
    const total = await Hero.countDocuments();
    const active = await Hero.countDocuments({ isActive: true });
    const withVideo = await Hero.countDocuments({ 'background.videoPublicId': { $exists: true, $ne: '' } });
    const withImage = await Hero.countDocuments({ 'background.imagePublicId': { $exists: true, $ne: '' } });
    
    res.json({
      success: true,
      data: {
        total,
        active,
        withVideo,
        withImage
      }
    });
  } catch (error) {
    console.error('Error fetching hero stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hero stats'
    });
  }
};

// @desc    Get all hero configurations
// @route   GET /api/hero/admin
// @access  Private/Admin
const getAllHeros = async (req, res) => {
  try {
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    
    // Search by template name or headline
    if (search) {
      query.$or = [
        { templateName: { $regex: search, $options: 'i' } },
        { headline: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const heros = await Hero.find(query).sort(sortOptions);
    
    res.json({
      success: true,
      count: heros.length,
      data: heros
    });
  } catch (error) {
    console.error('Error fetching heros:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hero configurations'
    });
  }
};

// @desc    Get single hero configuration by ID
// @route   GET /api/hero/admin/:id
// @access  Private/Admin
const getHeroById = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero configuration not found'
      });
    }
    
    res.json({
      success: true,
      data: hero
    });
  } catch (error) {
    console.error('Error fetching hero:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hero configuration'
    });
  }
};

// @desc    Create new hero configuration
// @route   POST /api/hero/admin
// @access  Private/Admin
const createHero = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const heroData = {
      templateName: req.body.templateName,
      badgeLabel: req.body.badgeLabel,
      headline: req.body.headline,
      subheadline: req.body.subheadline,
      primaryCta: {
        label: req.body.primaryCtaLabel,
        link: req.body.primaryCtaLink
      },
      secondaryCta: {
        label: req.body.secondaryCtaLabel,
        link: req.body.secondaryCtaLink
      },
      background: {
        type: req.body.backgroundType || 'video',
        videoUrl: req.body.backgroundVideoUrl,
        videoPublicId: req.body.backgroundVideoPublicId,
        imageUrl: req.body.backgroundImageUrl,
        imagePublicId: req.body.backgroundImagePublicId,
        overlay: req.body.backgroundOverlay === 'true' || req.body.backgroundOverlay === true,
        overlayOpacity: parseInt(req.body.backgroundOverlayOpacity) || 40
      },
      particles: {
        enabled: req.body.particlesEnabled === 'true' || req.body.particlesEnabled === true,
        count: parseInt(req.body.particlesCount) || 80,
        color: req.body.particlesColor || '#ffffff',
        size: parseInt(req.body.particlesSize) || 3,
        speed: parseInt(req.body.particlesSpeed) || 2,
        lineColor: req.body.particlesLineColor || '#ffffff',
        lineOpacity: parseFloat(req.body.particlesLineOpacity) || 0.4,
        interactivity: req.body.particlesInteractivity === 'true' || req.body.particlesInteractivity === true
      },
      isActive: req.body.isActive === 'true' || req.body.isActive === true
    };
    
    const hero = await Hero.create(heroData);
    
    // If marked as active, activate it (which deactivates others)
    if (heroData.isActive) {
      await hero.activate();
    }
    
    res.status(201).json({
      success: true,
      message: 'Hero configuration created successfully',
      data: hero
    });
  } catch (error) {
    console.error('Error creating hero:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hero configuration'
    });
  }
};

// @desc    Update hero configuration
// @route   PUT /api/hero/admin/:id
// @access  Private/Admin
const updateHero = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const hero = await Hero.findById(req.params.id);
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero configuration not found'
      });
    }
    
    // Update fields
    if (req.body.templateName !== undefined) hero.templateName = req.body.templateName;
    if (req.body.badgeLabel !== undefined) hero.badgeLabel = req.body.badgeLabel;
    if (req.body.headline !== undefined) hero.headline = req.body.headline;
    if (req.body.subheadline !== undefined) hero.subheadline = req.body.subheadline;
    
    if (req.body.primaryCtaLabel !== undefined) hero.primaryCta.label = req.body.primaryCtaLabel;
    if (req.body.primaryCtaLink !== undefined) hero.primaryCta.link = req.body.primaryCtaLink;
    
    if (req.body.secondaryCtaLabel !== undefined) hero.secondaryCta.label = req.body.secondaryCtaLabel;
    if (req.body.secondaryCtaLink !== undefined) hero.secondaryCta.link = req.body.secondaryCtaLink;
    
    if (req.body.backgroundType !== undefined) hero.background.type = req.body.backgroundType;
    if (req.body.backgroundVideoUrl !== undefined) hero.background.videoUrl = req.body.backgroundVideoUrl;
    if (req.body.backgroundVideoPublicId !== undefined) hero.background.videoPublicId = req.body.backgroundVideoPublicId;
    if (req.body.backgroundImageUrl !== undefined) hero.background.imageUrl = req.body.backgroundImageUrl;
    if (req.body.backgroundImagePublicId !== undefined) hero.background.imagePublicId = req.body.backgroundImagePublicId;
    if (req.body.backgroundOverlay !== undefined) hero.background.overlay = req.body.backgroundOverlay === 'true' || req.body.backgroundOverlay === true;
    if (req.body.backgroundOverlayOpacity !== undefined) hero.background.overlayOpacity = parseInt(req.body.backgroundOverlayOpacity);
    
    if (req.body.particlesEnabled !== undefined) hero.particles.enabled = req.body.particlesEnabled === 'true' || req.body.particlesEnabled === true;
    if (req.body.particlesCount !== undefined) hero.particles.count = parseInt(req.body.particlesCount);
    if (req.body.particlesColor !== undefined) hero.particles.color = req.body.particlesColor;
    if (req.body.particlesSize !== undefined) hero.particles.size = parseInt(req.body.particlesSize);
    if (req.body.particlesSpeed !== undefined) hero.particles.speed = parseInt(req.body.particlesSpeed);
    if (req.body.particlesLineColor !== undefined) hero.particles.lineColor = req.body.particlesLineColor;
    if (req.body.particlesLineOpacity !== undefined) hero.particles.lineOpacity = parseFloat(req.body.particlesLineOpacity);
    if (req.body.particlesInteractivity !== undefined) hero.particles.interactivity = req.body.particlesInteractivity === 'true' || req.body.particlesInteractivity === true;
    
    await hero.save();
    
    res.json({
      success: true,
      message: 'Hero configuration updated successfully',
      data: hero
    });
  } catch (error) {
    console.error('Error updating hero:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hero configuration'
    });
  }
};

// @desc    Delete hero configuration
// @route   DELETE /api/hero/admin/:id
// @access  Private/Admin
const deleteHero = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero configuration not found'
      });
    }
    
    // Don't allow deleting active hero
    if (hero.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active hero configuration. Please activate another one first.'
      });
    }
    
    // Delete media from Cloudinary
    if (hero.background.videoPublicId) {
      await deleteHeroVideo(hero.background.videoPublicId).catch(console.error);
    }
    if (hero.background.imagePublicId) {
      await deleteHeroImage(hero.background.imagePublicId).catch(console.error);
    }
    
    await hero.deleteOne();
    
    res.json({
      success: true,
      message: 'Hero configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hero:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hero configuration'
    });
  }
};

// @desc    Upload background video
// @route   POST /api/hero/admin/:id/video
// @access  Private/Admin
const uploadBackgroundVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }
    
    const hero = await Hero.findById(req.params.id);
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero configuration not found'
      });
    }
    
    // Delete old video if exists
    if (hero.background.videoPublicId) {
      await deleteHeroVideo(hero.background.videoPublicId).catch(console.error);
    }
    
    // Update with new video
    hero.background.videoUrl = req.file.path;
    hero.background.videoPublicId = req.file.filename;
    hero.background.type = 'video';
    
    await hero.save();
    
    res.json({
      success: true,
      message: 'Background video uploaded successfully',
      data: hero
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    
    // Clean up uploaded file if save fails
    if (req.file && req.file.filename) {
      await deleteHeroVideo(req.file.filename).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload background video'
    });
  }
};

// @desc    Upload background image
// @route   POST /api/hero/admin/:id/image
// @access  Private/Admin
const uploadBackgroundImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }
    
    const hero = await Hero.findById(req.params.id);
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero configuration not found'
      });
    }
    
    // Delete old image if exists
    if (hero.background.imagePublicId) {
      await deleteHeroImage(hero.background.imagePublicId).catch(console.error);
    }
    
    // Update with new image
    hero.background.imageUrl = req.file.path;
    hero.background.imagePublicId = req.file.filename;
    hero.background.type = 'image';
    
    await hero.save();
    
    res.json({
      success: true,
      message: 'Background image uploaded successfully',
      data: hero
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Clean up uploaded file if save fails
    if (req.file && req.file.filename) {
      await deleteHeroImage(req.file.filename).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload background image'
    });
  }
};

// @desc    Delete background media (video or image)
// @route   DELETE /api/hero/admin/:id/media/:type
// @access  Private/Admin
const deleteBackgroundMedia = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['video', 'image'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid media type. Must be "video" or "image"'
      });
    }
    
    const hero = await Hero.findById(req.params.id);
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero configuration not found'
      });
    }
    
    if (type === 'video') {
      if (hero.background.videoPublicId) {
        await deleteHeroVideo(hero.background.videoPublicId).catch(console.error);
      }
      hero.background.videoUrl = '';
      hero.background.videoPublicId = '';
    } else {
      if (hero.background.imagePublicId) {
        await deleteHeroImage(hero.background.imagePublicId).catch(console.error);
      }
      hero.background.imageUrl = '';
      hero.background.imagePublicId = '';
    }
    
    await hero.save();
    
    res.json({
      success: true,
      message: `Background ${type} deleted successfully`,
      data: hero
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete background media'
    });
  }
};

// @desc    Set hero as active (deactivate others)
// @route   PATCH /api/hero/admin/:id/activate
// @access  Private/Admin
const setActiveHero = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero configuration not found'
      });
    }
    
    await hero.activate();
    
    res.json({
      success: true,
      message: 'Hero configuration activated successfully',
      data: hero
    });
  } catch (error) {
    console.error('Error activating hero:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate hero configuration'
    });
  }
};

module.exports = {
  getActiveHero,
  getAllHeros,
  getHeroById,
  getHeroStats,
  createHero,
  updateHero,
  deleteHero,
  uploadBackgroundVideo,
  uploadBackgroundImage,
  deleteBackgroundMedia,
  setActiveHero
};



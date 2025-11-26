const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const { videoUpload, imageUpload } = require('../config/cloudinaryHero');
const {
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
} = require('../controllers/heroController');

// Validation middleware
const heroValidation = [
  body('templateName')
    .trim()
    .notEmpty().withMessage('Template name is required')
    .isLength({ max: 100 }).withMessage('Template name cannot exceed 100 characters'),
  body('headline')
    .trim()
    .notEmpty().withMessage('Headline is required')
    .isLength({ max: 200 }).withMessage('Headline cannot exceed 200 characters'),
  body('badgeLabel')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Badge label cannot exceed 50 characters'),
  body('subheadline')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Subheadline cannot exceed 500 characters'),
  body('primaryCtaLabel')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('Primary CTA label cannot exceed 30 characters'),
  body('primaryCtaLink')
    .optional()
    .trim(),
  body('secondaryCtaLabel')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('Secondary CTA label cannot exceed 30 characters'),
  body('secondaryCtaLink')
    .optional()
    .trim(),
  body('backgroundType')
    .optional()
    .isIn(['video', 'image']).withMessage('Background type must be either "video" or "image"'),
  body('backgroundOverlayOpacity')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Overlay opacity must be between 0 and 100'),
  body('particlesCount')
    .optional()
    .isInt({ min: 20, max: 150 }).withMessage('Particle count must be between 20 and 150'),
  body('particlesSize')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Particle size must be between 1 and 10'),
  body('particlesSpeed')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Particle speed must be between 1 and 10'),
  body('particlesLineOpacity')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('Line opacity must be between 0 and 1')
];

// Public route - Get active hero configuration
router.get('/active', getActiveHero);

// Admin routes (all require authentication)
router.get('/admin/stats', auth, adminAuth, getHeroStats);
router.get('/admin', auth, adminAuth, getAllHeros);
router.get('/admin/:id', auth, adminAuth, getHeroById);
router.post('/admin', auth, adminAuth, heroValidation, createHero);
router.put('/admin/:id', auth, adminAuth, heroValidation, updateHero);
router.delete('/admin/:id', auth, adminAuth, deleteHero);

// Media upload routes
router.post(
  '/admin/:id/video',
  auth,
  adminAuth,
  (req, res, next) => {
    videoUpload.single('video')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  },
  uploadBackgroundVideo
);

router.post(
  '/admin/:id/image',
  auth,
  adminAuth,
  (req, res, next) => {
    imageUpload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  },
  uploadBackgroundImage
);

// Delete media route
router.delete('/admin/:id/media/:type', auth, adminAuth, deleteBackgroundMedia);

// Activate hero route
router.patch('/admin/:id/activate', auth, adminAuth, setActiveHero);

module.exports = router;


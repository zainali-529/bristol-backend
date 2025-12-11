const express = require('express');
const { param, body } = require('express-validator');
const { getFeatureStatus, startFeatureDemo, getFeatureDemoStatus } = require('../controllers/featureAccessController');

const router = express.Router();

router.get('/:featureKey', param('featureKey').isLength({ min: 2, max: 50 }), getFeatureStatus);
router.post(
  '/:featureKey/demo/start',
  param('featureKey').isLength({ min: 2, max: 50 }),
  body('durationMinutes').optional().isInt({ min: 1, max: 60 }),
  startFeatureDemo
);
router.get(
  '/:featureKey/demo/status',
  param('featureKey').isLength({ min: 2, max: 50 }),
  getFeatureDemoStatus
);

module.exports = router;

const FeatureAccess = require('../models/FeatureAccess');

const getFeatureStatus = async (req, res) => {
  try {
    const key = String(req.params.featureKey || '').toLowerCase();
    if (!key) return res.status(400).json({ success: false, message: 'featureKey is required' });
    const doc = await FeatureAccess.findOne({ featureKey: key });
    return res.json({ success: true, data: { featureKey: key, isUnlocked: !!doc?.isUnlocked } });
  } catch (err) {
    console.error('Get feature access error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching feature access' });
  }
};

const startFeatureDemo = async (req, res) => {
  try {
    const key = String(req.params.featureKey || '').toLowerCase();
    if (!key) return res.status(400).json({ success: false, message: 'featureKey is required' });
    const durationMinutes = Number(req.body?.durationMinutes) || 1440;
    const doc = await FeatureAccess.findOneAndUpdate(
      { featureKey: key },
      { featureKey: key, demoUsed: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, data: { featureKey: key, canDemo: false, durationMinutes } });
  } catch (err) {
    console.error('Start feature demo error:', err);
    return res.status(500).json({ success: false, message: 'Server error while starting feature demo' });
  }
};

const getFeatureDemoStatus = async (req, res) => {
  try {
    const key = String(req.params.featureKey || '').toLowerCase();
    if (!key) return res.status(400).json({ success: false, message: 'featureKey is required' });
    const doc = await FeatureAccess.findOne({ featureKey: key });
    const canDemo = !doc?.demoUsed;
    return res.json({ success: true, data: { featureKey: key, canDemo } });
  } catch (err) {
    console.error('Get feature demo status error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching feature demo status' });
  }
};

module.exports = { getFeatureStatus, startFeatureDemo, getFeatureDemoStatus };

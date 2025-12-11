const mongoose = require('mongoose');

const featureAccessSchema = new mongoose.Schema({
  featureKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  isUnlocked: {
    type: Boolean,
    default: false,
  },
  unlockedAt: {
    type: Date,
  },
  demoUsed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

featureAccessSchema.statics.setUnlocked = async function(featureKey, unlocked) {
  const key = String(featureKey).toLowerCase();
  const update = {
    featureKey: key,
    isUnlocked: !!unlocked,
    unlockedAt: unlocked ? new Date() : undefined,
  };
  const doc = await this.findOneAndUpdate(
    { featureKey: key },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
};

module.exports = mongoose.model('FeatureAccess', featureAccessSchema);

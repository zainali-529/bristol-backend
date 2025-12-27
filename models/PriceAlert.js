const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },

  // Alert preferences
  preferences: {
    electricityThreshold: {
      type: Number,
      default: null // Alert when price changes by this percentage
    },
    gasThreshold: {
      type: Number,
      default: null
    },
    notifyOnDrop: {
      type: Boolean,
      default: true
    },
    notifyOnRise: {
      type: Boolean,
      default: true
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Last notification sent
  lastNotified: {
    type: Date,
    default: null
  },

  // Subscription metadata
  subscribedAt: {
    type: Date,
    default: Date.now
  },

  unsubscribeToken: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Indexes
priceAlertSchema.index({ isActive: 1 });

// Generate unsubscribe token before saving
priceAlertSchema.pre('save', function(next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
  }
  next();
});

// Static method to get all active subscribers
priceAlertSchema.statics.getActiveSubscribers = function() {
  return this.find({ isActive: true }).select('email preferences lastNotified');
};

module.exports = mongoose.model('PriceAlert', priceAlertSchema);


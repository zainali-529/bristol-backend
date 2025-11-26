const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
  // Template Info
  templateName: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Template name cannot exceed 100 characters']
  },
  
  // Content
  badgeLabel: {
    type: String,
    trim: true,
    maxlength: [50, 'Badge label cannot exceed 50 characters'],
    default: "Powering UK's Businesses"
  },
  
  headline: {
    type: String,
    required: [true, 'Headline is required'],
    trim: true,
    maxlength: [200, 'Headline cannot exceed 200 characters']
  },
  
  subheadline: {
    type: String,
    trim: true,
    maxlength: [500, 'Subheadline cannot exceed 500 characters'],
    default: ''
  },
  
  // Primary CTA
  primaryCta: {
    label: {
      type: String,
      trim: true,
      maxlength: [30, 'CTA label cannot exceed 30 characters'],
      default: 'Explore Us'
    },
    link: {
      type: String,
      trim: true,
      default: '/about'
    }
  },
  
  // Secondary CTA
  secondaryCta: {
    label: {
      type: String,
      trim: true,
      maxlength: [30, 'CTA label cannot exceed 30 characters'],
      default: 'Contact Us'
    },
    link: {
      type: String,
      trim: true,
      default: '/contact'
    }
  },
  
  // Background
  background: {
    type: {
      type: String,
      enum: ['video', 'image'],
      default: 'video'
    },
    videoUrl: {
      type: String,
      trim: true,
      default: '/videos/hero-bg-video.mp4'
    },
    videoPublicId: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    imagePublicId: {
      type: String,
      trim: true
    },
    overlay: {
      type: Boolean,
      default: false
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 100,
      default: 40
    }
  },
  
  // Particles Configuration
  particles: {
    enabled: {
      type: Boolean,
      default: true
    },
    count: {
      type: Number,
      min: 20,
      max: 150,
      default: 80
    },
    color: {
      type: String,
      trim: true,
      default: '#ffffff'
    },
    size: {
      type: Number,
      min: 1,
      max: 10,
      default: 3
    },
    speed: {
      type: Number,
      min: 1,
      max: 10,
      default: 2
    },
    lineColor: {
      type: String,
      trim: true,
      default: '#ffffff'
    },
    lineOpacity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.4
    },
    interactivity: {
      type: Boolean,
      default: true
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
heroSchema.index({ isActive: 1 });
heroSchema.index({ createdAt: -1 });

// Pre-save middleware
heroSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active hero
heroSchema.statics.getActiveHero = function() {
  return this.findOne({ isActive: true });
};

// Instance method to activate this hero (deactivate others)
heroSchema.methods.activate = async function() {
  // Deactivate all other heroes
  await this.constructor.updateMany(
    { _id: { $ne: this._id } },
    { $set: { isActive: false } }
  );
  
  // Activate this hero
  this.isActive = true;
  return this.save();
};

module.exports = mongoose.model('Hero', heroSchema);



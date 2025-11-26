const mongoose = require('mongoose');

// Schema for individual trust card
const trustCardSchema = new mongoose.Schema({
  icon: {
    type: String, // Lucide icon name
    required: [true, 'Icon is required'],
    trim: true,
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  order: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  }
}, { _id: false });

const whyTrustUsSchema = new mongoose.Schema({
  cards: {
    type: [trustCardSchema],
    validate: {
      validator: function(cards) {
        return cards.length === 3;
      },
      message: 'Exactly 3 trust cards are required'
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
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
whyTrustUsSchema.index({ isActive: 1 });
whyTrustUsSchema.index({ updatedAt: -1 });

// Pre-save middleware to update timestamp and ensure order
whyTrustUsSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = new Date();
  
  // Ensure cards are properly ordered
  if (this.cards && this.cards.length === 3) {
    this.cards = this.cards.map((card, index) => ({
      ...card,
      order: index + 1
    }));
  }
  
  next();
});

// Static method to get or create the single document
whyTrustUsSchema.statics.getSingle = async function() {
  let doc = await this.findOne();
  
  // If no document exists, create one with default values
  if (!doc) {
    doc = await this.create({
      cards: [
        {
          icon: 'Zap',
          title: '24/7 Rapid Response',
          description: 'We\'re on call day and night to tackle gas or electricity faults and minimise downtime.',
          order: 1
        },
        {
          icon: 'ShieldCheck',
          title: 'Transparent, Competitive Rates',
          description: 'We\'re on call day and night to tackle gas or electricity faults and minimise downtime.',
          order: 2
        },
        {
          icon: 'Award',
          title: 'Safety and Compliance First',
          description: 'We\'re on call day and night to tackle gas or electricity faults and minimise downtime.',
          order: 3
        }
      ],
      isActive: true
    });
  }
  
  return doc;
};

// Static method to get active cards for public display
whyTrustUsSchema.statics.getActiveCards = async function() {
  const doc = await this.getSingle();
  
  if (doc && doc.isActive) {
    return doc.cards.sort((a, b) => a.order - b.order);
  }
  
  return [];
};

module.exports = mongoose.model('WhyTrustUs', whyTrustUsSchema);


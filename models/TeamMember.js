const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Team member name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Image
  image: {
    url: {
      type: String,
      required: [true, 'Team member image is required'],
      trim: true
    },
    publicId: {
      type: String, // Cloudinary public ID for deletion
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    }
  },
  
  // Social Links
  socialLinks: {
    linkedin: {
      type: String,
      trim: true,
      validate: {
        validator: function(url) {
          if (!url) return true; // Optional
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          return urlRegex.test(url);
        },
        message: 'Please provide a valid LinkedIn URL'
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(email) {
          if (!email) return true; // Optional
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address'
      }
    },
    twitter: {
      type: String,
      trim: true,
      validate: {
        validator: function(url) {
          if (!url) return true; // Optional
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          return urlRegex.test(url);
        },
        message: 'Please provide a valid Twitter URL'
      }
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(url) {
          if (!url) return true; // Optional
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          return urlRegex.test(url);
        },
        message: 'Please provide a valid website URL'
      }
    }
  },
  
  // Status and Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Display Order
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
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
teamMemberSchema.index({ isActive: 1, displayOrder: 1 });
teamMemberSchema.index({ name: 1 });
teamMemberSchema.index({ position: 1 });

// Pre-save middleware to ensure displayOrder is set
teamMemberSchema.pre('save', async function(next) {
  if (this.isNew && this.displayOrder === undefined) {
    const maxOrder = await mongoose.model('TeamMember').findOne().sort('-displayOrder').select('displayOrder');
    this.displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
  }
  next();
});

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

module.exports = TeamMember;


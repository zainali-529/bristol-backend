const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema({
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
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
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
  savings: {
    type: String, // e.g., "18%", "20%", "Up to 30%"
    required: [true, 'Savings is required'],
    trim: true,
    maxlength: [20, 'Savings cannot exceed 20 characters']
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Section header content (optional, can be managed separately)
  sectionTitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Section title cannot exceed 200 characters']
  },
  sectionDescription: {
    type: String,
    trim: true,
    maxlength: [1000, 'Section description cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
industrySchema.index({ isActive: 1, displayOrder: 1 });
industrySchema.index({ updatedAt: -1 });

// Pre-save middleware
industrySchema.pre('save', function(next) {
  // Ensure displayOrder is set if not provided
  if (this.displayOrder === undefined || this.displayOrder === null) {
    // Set to a high number so new items appear at the end
    this.displayOrder = Date.now();
  }
  next();
});

module.exports = mongoose.model('Industry', industrySchema);


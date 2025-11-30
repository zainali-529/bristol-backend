const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true,
    maxlength: [100, 'Company cannot exceed 100 characters']
  },
  testimonial: {
    type: String,
    required: [true, 'Testimonial text is required'],
    trim: true,
    maxlength: [1000, 'Testimonial cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 5
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
testimonialSchema.index({ isActive: 1, displayOrder: 1 });
testimonialSchema.index({ createdAt: -1 });

// Pre-save middleware
testimonialSchema.pre('save', function(next) {
  // Ensure displayOrder is set if not provided
  if (this.displayOrder === undefined || this.displayOrder === null) {
    // Set to a high number so new items appear at the end
    this.displayOrder = Date.now();
  }
  next();
});

module.exports = mongoose.model('Testimonial', testimonialSchema);


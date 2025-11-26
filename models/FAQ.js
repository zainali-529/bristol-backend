const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
    default: 'General'
  },
  
  // Status and Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Display Order
  displayOrder: {
    type: Number,
    default: 0
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

// Indexes for better performance
faqSchema.index({ isActive: 1, displayOrder: 1 });
faqSchema.index({ category: 1 });
faqSchema.index({ createdAt: -1 });
faqSchema.index({ question: 'text', answer: 'text' });

// Pre-save middleware to update timestamp
faqSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active FAQs for public display
faqSchema.statics.getActiveFAQs = function(category = null) {
  const query = { isActive: true };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ displayOrder: 1, createdAt: -1 })
    .select('question answer category displayOrder');
};

// Static method to get all categories
faqSchema.statics.getCategories = function() {
  return this.distinct('category', { isActive: true });
};

module.exports = mongoose.model('FAQ', faqSchema);


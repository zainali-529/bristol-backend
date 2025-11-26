const mongoose = require('mongoose');

// Schema for individual work step
const workStepSchema = new mongoose.Schema({
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

const howWeWorkSchema = new mongoose.Schema({
  steps: {
    type: [workStepSchema],
    validate: {
      validator: function(steps) {
        return steps.length === 3;
      },
      message: 'Exactly 3 work steps are required'
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
howWeWorkSchema.index({ isActive: 1 });
howWeWorkSchema.index({ updatedAt: -1 });

// Pre-save middleware to update timestamp and ensure order
howWeWorkSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = new Date();
  
  // Ensure steps are properly ordered
  if (this.steps && this.steps.length === 3) {
    this.steps = this.steps.map((step, index) => ({
      ...step,
      order: index + 1
    }));
  }
  
  next();
});

// Static method to get or create the single document
howWeWorkSchema.statics.getSingle = async function() {
  let doc = await this.findOne();
  
  // If no document exists, create one with placeholder values
  if (!doc) {
    doc = await this.create({
      steps: [
        {
          image: {
            url: 'https://via.placeholder.com/600x400',
            publicId: '',
            alt: 'Step 1'
          },
          title: 'Just Getting Started?',
          description: 'Orca Business Solutions is a new name, but we\'re built on real experience. We work with.',
          order: 1
        },
        {
          image: {
            url: 'https://via.placeholder.com/600x400',
            publicId: '',
            alt: 'Step 2'
          },
          title: 'Struggling with High Bills?',
          description: 'Orca Business Solutions is a new name, but we\'re built on real experience. We work with.',
          order: 2
        },
        {
          image: {
            url: 'https://via.placeholder.com/600x400',
            publicId: '',
            alt: 'Step 3'
          },
          title: 'Planning for Growth?',
          description: 'Orca Business Solutions is a new name, but we\'re built on real experience. We work with.',
          order: 3
        }
      ],
      isActive: true
    });
  }
  
  return doc;
};

// Static method to get active steps for public display
howWeWorkSchema.statics.getActiveSteps = async function() {
  const doc = await this.getSingle();
  
  if (doc && doc.isActive) {
    return doc.steps.sort((a, b) => a.order - b.order);
  }
  
  return [];
};

module.exports = mongoose.model('HowWeWork', howWeWorkSchema);


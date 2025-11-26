const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  description: {
    type: String,
    required: [true, 'Supplier description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  websiteUrl: {
    type: String,
    required: [true, 'Website URL is required'],
    trim: true,
    validate: {
      validator: function(url) {
        // Basic URL validation
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlRegex.test(url);
      },
      message: 'Please provide a valid website URL'
    }
  },
  
  // Image
  image: {
    url: {
      type: String,
      required: [true, 'Supplier image is required'],
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
  
  // SEO Fields
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters'],
    default: ''
  },
  
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters'],
    default: ''
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
supplierSchema.index({ slug: 1 });
supplierSchema.index({ isActive: 1, displayOrder: 1 });
supplierSchema.index({ createdAt: -1 });

// Pre-save middleware
supplierSchema.pre('save', function(next) {
  // Generate slug from name if not provided
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
  
  // Ensure website URL has protocol
  if (this.websiteUrl && !this.websiteUrl.startsWith('http')) {
    this.websiteUrl = 'https://' + this.websiteUrl;
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  // Auto-generate meta fields if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.name.substring(0, 60);
  }
  
  if (!this.metaDescription && this.description) {
    this.metaDescription = this.description.substring(0, 160);
  }
  
  next();
});

// Virtual for URL
supplierSchema.virtual('url').get(function() {
  return `/suppliers/${this.slug}`;
});

// Static methods
supplierSchema.statics.getActiveSuppliers = function() {
  return this.find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 });
};

// Instance methods
supplierSchema.methods.getPublicData = function() {
  return {
    _id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    websiteUrl: this.websiteUrl,
    image: this.image,
    displayOrder: this.displayOrder,
    url: this.url
  };
};

module.exports = mongoose.model('Supplier', supplierSchema);
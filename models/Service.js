const mongoose = require('mongoose');

// Schema for bullet points (used in Services Include and Benefits)
const bulletPointSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Schema for expertise cards
const expertiseCardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  icon: {
    type: String, // Lucide icon name
    trim: true,
    maxlength: 50
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Schema for secondary images
const secondaryImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
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
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const serviceSchema = new mongoose.Schema({
  // Basic Information (for cards and detail page)
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // Card Information
  cardDescription: {
    type: String,
    required: [true, 'Card description is required'],
    trim: true,
    maxlength: [200, 'Card description cannot exceed 200 characters']
  },
  
  cardIcon: {
    type: String, // Lucide icon name
    required: [true, 'Card icon is required'],
    trim: true,
    maxlength: 50
  },
  
  // Detail Page - Main Image (Required)
  mainImage: {
    url: {
      type: String,
      required: [true, 'Main image is required'],
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
  
  // Detail Page - About Service
  aboutService: {
    type: String,
    required: [true, 'About service description is required'],
    trim: true,
    maxlength: [2000, 'About service cannot exceed 2000 characters']
  },
  
  // Detail Page - Services Include
  servicesInclude: {
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Services include description cannot exceed 1000 characters'],
      default: ''
    },
    bulletPoints: [bulletPointSchema]
  },
  
  // Detail Page - Secondary Images (Optional, max 2)
  secondaryImages: {
    type: [secondaryImageSchema],
    validate: {
      validator: function(images) {
        return images.length <= 2;
      },
      message: 'Maximum 2 secondary images allowed'
    },
    default: []
  },
  
  // Detail Page - Expertise
  expertise: {
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Expertise description cannot exceed 1000 characters'],
      default: ''
    },
    cards: [expertiseCardSchema]
  },
  
  // Detail Page - Services Benefits
  servicesBenefits: {
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Services benefits description cannot exceed 1000 characters'],
      default: ''
    },
    bulletPoints: [bulletPointSchema]
  },
  
  // SEO and Meta Information
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
  
  // Status and Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
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
serviceSchema.index({ isActive: 1, displayOrder: 1 });
serviceSchema.index({ isFeatured: 1, displayOrder: 1 });
serviceSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug and update timestamps
serviceSchema.pre('save', function(next) {
  // Generate slug from title if not provided
  if (!this.slug || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  // Auto-generate meta fields if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.title.substring(0, 60);
  }
  
  if (!this.metaDescription && this.cardDescription) {
    this.metaDescription = this.cardDescription.substring(0, 160);
  }
  
  next();
});

// Virtual for full URL (if needed)
serviceSchema.virtual('url').get(function() {
  return `/services/${this.slug}`;
});

// Static method to get active services for public display
serviceSchema.statics.getActiveServices = function() {
  return this.find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 })
    .select('title slug cardDescription cardIcon displayOrder isFeatured');
};

// Static method to get featured services
serviceSchema.statics.getFeaturedServices = function() {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ displayOrder: 1, createdAt: -1 })
    .select('title slug cardDescription cardIcon displayOrder');
};

// Instance method to get card data
serviceSchema.methods.getCardData = function() {
  return {
    _id: this._id,
    title: this.title,
    slug: this.slug,
    cardDescription: this.cardDescription,
    cardIcon: this.cardIcon,
    isFeatured: this.isFeatured,
    displayOrder: this.displayOrder
  };
};

// Instance method to get full detail data
serviceSchema.methods.getDetailData = function() {
  return {
    _id: this._id,
    title: this.title,
    slug: this.slug,
    cardDescription: this.cardDescription,
    cardIcon: this.cardIcon,
    mainImage: this.mainImage,
    aboutService: this.aboutService,
    servicesInclude: this.servicesInclude,
    secondaryImages: this.secondaryImages,
    expertise: this.expertise,
    servicesBenefits: this.servicesBenefits,
    metaTitle: this.metaTitle,
    metaDescription: this.metaDescription,
    isFeatured: this.isFeatured,
    displayOrder: this.displayOrder,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Service', serviceSchema);

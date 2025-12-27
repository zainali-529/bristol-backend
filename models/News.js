const mongoose = require('mongoose');

// Schema for news content sections (for rich content)
const contentSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['paragraph', 'heading', 'image', 'list', 'quote'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Schema for related images
const newsImageSchema = new mongoose.Schema({
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

const newsSchema = new mongoose.Schema({
  // Basic Information (for cards and detail page)
  title: {
    type: String,
    required: [true, 'News title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // Card Information (for news listing)
  cardDescription: {
    type: String,
    required: [true, 'Card description is required'],
    trim: true,
    maxlength: [300, 'Card description cannot exceed 300 characters']
  },
  
  cardImage: {
    url: {
      type: String,
      required: [true, 'Card image is required'],
      trim: true
    },
    publicId: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    }
  },
  
  // Detail Page - Featured Image (Main hero image)
  featuredImage: {
    url: {
      type: String,
      required: [true, 'Featured image is required'],
      trim: true
    },
    publicId: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    }
  },
  
  // Detail Page - Full Content
  content: {
    type: String,
    required: [true, 'News content is required'],
    trim: true,
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  
  // Rich content sections (optional, for structured content)
  contentSections: {
    type: [contentSectionSchema],
    default: []
  },
  
  // Additional images for detail page
  additionalImages: {
    type: [newsImageSchema],
    default: []
  },
  
  // Category and Tags
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    default: 'General'
  },
  
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return tags.length <= 10; // Max 10 tags
      },
      message: 'Maximum 10 tags allowed'
    }
  },
  
  // Author Information
  author: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters'],
      default: 'Bristol Utilities'
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, 'Author email cannot exceed 100 characters']
    },
    avatar: {
      type: String,
      trim: true
    }
  },
  
  // Publishing Information
  publishDate: {
    type: Date,
    default: Date.now
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
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
  
  metaKeywords: {
    type: [String],
    default: []
  },
  
  // Visibility and Features
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isBreaking: {
    type: Boolean,
    default: false
  },
  
  // Display Order
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // Reading time (auto-calculated)
  readingTime: {
    type: Number, // in minutes
    default: 0
  },
  
  // View count (for analytics)
  views: {
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
newsSchema.index({ status: 1, publishDate: -1 });
newsSchema.index({ isActive: 1, status: 1, publishDate: -1 });
newsSchema.index({ isFeatured: 1, publishDate: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ tags: 1 });
newsSchema.index({ createdAt: -1 });
newsSchema.index({ title: 'text', content: 'text', cardDescription: 'text' }); // Text search

// Pre-save middleware
newsSchema.pre('save', function(next) {
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
  
  // Calculate reading time (average 200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  // Ensure publishDate is set for published articles
  if (this.status === 'published' && !this.publishDate) {
    this.publishDate = new Date();
  }
  
  next();
});

// Virtual for full URL
newsSchema.virtual('url').get(function() {
  return `/news/${this.slug}`;
});

// Static method to get published news for public display (cards)
newsSchema.statics.getPublishedNews = function(limit = null, featured = false) {
  const query = this.find({ 
    status: 'published', 
    isActive: true,
    publishDate: { $lte: new Date() } // Only show published articles
  });
  
  if (featured) {
    query.where('isFeatured', true);
  }
  
  query.sort({ publishDate: -1, displayOrder: 1 });
  
  if (limit) {
    query.limit(limit);
  }
  
  return query.select('title slug cardDescription cardImage publishDate category author views readingTime isFeatured isBreaking');
};

// Static method to get news by category
newsSchema.statics.getNewsByCategory = function(category, limit = null) {
  const query = this.find({ 
    status: 'published', 
    isActive: true,
    category: category,
    publishDate: { $lte: new Date() }
  });
  
  query.sort({ publishDate: -1, displayOrder: 1 });
  
  if (limit) {
    query.limit(limit);
  }
  
  return query.select('title slug cardDescription cardImage publishDate category author views readingTime');
};

// Static method to get related news
newsSchema.statics.getRelatedNews = function(currentNewsId, category, limit = 3) {
  return this.find({
    _id: { $ne: currentNewsId },
    status: 'published',
    isActive: true,
    category: category,
    publishDate: { $lte: new Date() }
  })
  .sort({ publishDate: -1 })
  .limit(limit)
  .select('title slug cardDescription cardImage publishDate');
};

// Static method to get news categories
newsSchema.statics.getCategories = function() {
  return this.distinct('category', { 
    status: 'published', 
    isActive: true 
  });
};

// Static method to get popular tags
newsSchema.statics.getPopularTags = function(limit = 20) {
  return this.aggregate([
    { $match: { status: 'published', isActive: true } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, tag: '$_id', count: 1 } }
  ]);
};

// Instance method to get card data
newsSchema.methods.getCardData = function() {
  return {
    _id: this._id,
    title: this.title,
    slug: this.slug,
    cardDescription: this.cardDescription,
    cardImage: this.cardImage,
    category: this.category,
    tags: this.tags,
    author: this.author,
    publishDate: this.publishDate,
    views: this.views,
    readingTime: this.readingTime,
    isFeatured: this.isFeatured,
    isBreaking: this.isBreaking,
    displayOrder: this.displayOrder
  };
};

// Instance method to get full detail data
newsSchema.methods.getDetailData = function() {
  // Increment view count
  this.views += 1;
  this.save().catch(console.error);
  
  return {
    _id: this._id,
    title: this.title,
    slug: this.slug,
    cardDescription: this.cardDescription,
    cardImage: this.cardImage,
    featuredImage: this.featuredImage,
    content: this.content,
    contentSections: this.contentSections,
    additionalImages: this.additionalImages,
    category: this.category,
    tags: this.tags,
    author: this.author,
    publishDate: this.publishDate,
    views: this.views,
    readingTime: this.readingTime,
    isFeatured: this.isFeatured,
    isBreaking: this.isBreaking,
    metaTitle: this.metaTitle,
    metaDescription: this.metaDescription,
    metaKeywords: this.metaKeywords,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('News', newsSchema);


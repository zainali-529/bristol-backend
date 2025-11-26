const mongoose = require('mongoose');

// Schema for document versions (version control)
const documentVersionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true
  },
  file: {
    url: {
      type: String,
      required: true,
      trim: true
    },
    publicId: {
      type: String, // Cloudinary public ID
      trim: true
    },
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    fileSize: {
      type: Number, // in bytes
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  },
  uploadedBy: {
    type: String, // Admin ID from JWT token
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  changeNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isCurrent: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// Schema for document sharing/permissions
const documentShareSchema = new mongoose.Schema({
  sharedWith: {
    type: String, // Admin ID from JWT token
    required: true
  },
  permission: {
    type: String,
    enum: ['view', 'download', 'edit'],
    default: 'view'
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
}, { _id: true });

const documentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  
  // File Information (Current Version)
  file: {
    url: {
      type: String,
      required: true,
      trim: true
    },
    publicId: {
      type: String, // Cloudinary public ID for deletion
      trim: true
    },
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true
    },
    fileSize: {
      type: Number, // in bytes
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileExtension: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: 100,
    enum: [
      'contracts',
      'quotes',
      'invoices',
      'reports',
      'policies',
      'certificates',
      'legal',
      'marketing',
      'other'
    ]
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // Version Control
  versions: [documentVersionSchema],
  currentVersion: {
    type: Number,
    default: 1
  },
  
  // Metadata
  uploadedBy: {
    type: String, // Admin ID from JWT token
    required: true
  },
  
  lastModifiedBy: {
    type: String // Admin ID from JWT token
  },
  
  // Sharing & Permissions
  isPublic: {
    type: Boolean,
    default: false
  },
  
  sharedWith: [documentShareSchema],
  
  // Access Control
  accessLevel: {
    type: String,
    enum: ['private', 'internal', 'public'],
    default: 'private'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Dates
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  lastAccessedAt: {
    type: Date
  },
  
  expiresAt: {
    type: Date // For time-sensitive documents
  },
  
  // SEO & Search
  keywords: [{
    type: String,
    trim: true
  }],
  
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
documentSchema.index({ title: 'text', description: 'text', tags: 'text', keywords: 'text' }); // Full-text search
documentSchema.index({ category: 1, isActive: 1, isArchived: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ 'file.fileExtension': 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ lastAccessedAt: -1 });
documentSchema.index({ uploadedAt: -1 });

// Pre-save middleware
documentSchema.pre('save', function(next) {
  // Auto-generate keywords from title and description
  if (this.isModified('title') || this.isModified('description')) {
    const text = `${this.title} ${this.description}`.toLowerCase();
    this.keywords = [...new Set(text.split(/\s+/).filter(word => word.length > 3))];
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Instance method to get file icon
documentSchema.methods.getFileIcon = function() {
  const iconMap = {
    'pdf': 'FileText',
    'doc': 'FileText',
    'docx': 'FileText',
    'xls': 'FileSpreadsheet',
    'xlsx': 'FileSpreadsheet',
    'ppt': 'FilePresentation',
    'pptx': 'FilePresentation',
    'jpg': 'Image',
    'jpeg': 'Image',
    'png': 'Image',
    'gif': 'Image',
    'webp': 'Image',
    'zip': 'Archive',
    'rar': 'Archive',
    'txt': 'FileText',
    'csv': 'FileSpreadsheet'
  };
  return iconMap[this.file.fileExtension] || 'File';
};

// Instance method to format file size
documentSchema.methods.getFormattedFileSize = function() {
  const bytes = this.file.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Static method to get documents by category
documentSchema.statics.getDocumentsByCategory = function(category) {
  return this.find({ 
    category: category, 
    isActive: true, 
    isArchived: false 
  }).sort({ uploadedAt: -1 });
};

// Static method to get active documents
documentSchema.statics.getActiveDocuments = function() {
  return this.find({ 
    isActive: true, 
    isArchived: false 
  }).sort({ uploadedAt: -1 });
};

module.exports = mongoose.model('Document', documentSchema);


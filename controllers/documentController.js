const Document = require('../models/Document');
const { validationResult } = require('express-validator');
const { deleteDocument, getFileExtension, getMimeType } = require('../config/cloudinaryDocuments');

// @desc    Get document statistics
// @route   GET /api/documents/admin/stats
// @access  Private/Admin
const getDocumentStats = async (req, res) => {
  try {
    const total = await Document.countDocuments();
    const active = await Document.countDocuments({ isActive: true, isArchived: false });
    const archived = await Document.countDocuments({ isArchived: true });
    
    // Count by category
    const byCategory = await Document.aggregate([
      { $match: { isActive: true, isArchived: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Count by file type
    const byFileType = await Document.aggregate([
      { $match: { isActive: true, isArchived: false } },
      { $group: { _id: '$file.fileExtension', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Total storage used (approximate)
    const storageStats = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: null,
        totalSize: { $sum: '$file.fileSize' },
        avgSize: { $avg: '$file.fileSize' }
      }}
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        archived,
        byCategory,
        byFileType,
        storage: storageStats[0] || { totalSize: 0, avgSize: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching document statistics' 
    });
  }
};

// @desc    Get all documents (admin)
// @route   GET /api/documents/admin
// @access  Private/Admin
const getAllDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Status filter
    if (req.query.status === 'archived') {
      filter.isArchived = true;
    } else if (req.query.status === 'active') {
      filter.isArchived = false;
      filter.isActive = true;
    }
    
    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // File type filter
    if (req.query.fileType) {
      filter['file.fileExtension'] = req.query.fileType;
    }
    
    // Search filter (full-text search)
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    // Tag filter
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    
    // Access level filter
    if (req.query.accessLevel) {
      filter.accessLevel = req.query.accessLevel;
    }
    
    // Sort
    let sortOption = { uploadedAt: -1 };
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sortOption = { [sortField]: sortOrder };
    }
    
    const documents = await Document.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    const total = await Document.countDocuments(filter);
    
    res.json({
      success: true,
      count: documents.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching documents' 
    });
  }
};

// @desc    Get single document by ID
// @route   GET /api/documents/admin/:id
// @access  Private/Admin
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Update last accessed
    document.lastAccessedAt = new Date();
    await document.save();
    
    res.json({ success: true, data: document });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching document' 
    });
  }
};

// @desc    Create new document
// @route   POST /api/documents/admin
// @access  Private/Admin
const createDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'File is required' 
      });
    }
    
    const {
      title,
      description,
      category,
      tags,
      accessLevel,
      isPublic,
      expiresAt
    } = req.body;
    
    // Parse tags if string
    const tagArray = typeof tags === 'string' 
      ? tags.split(',').map(t => t.trim()).filter(t => t)
      : Array.isArray(tags) ? tags : [];
    
    // Get file extension and MIME type
    const fileExtension = getFileExtension(req.file.originalname);
    const mimeType = getMimeType(fileExtension) || req.file.mimetype;
    
    // Create document
    const document = new Document({
      title,
      description: description || '',
      category,
      tags: tagArray,
      file: {
        url: req.file.path,
        publicId: req.file.filename,
        fileName: req.file.originalname,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: mimeType,
        fileExtension: fileExtension
      },
      uploadedBy: req.user.id,
      accessLevel: accessLevel || 'private',
      isPublic: isPublic === 'true' || isPublic === true,
      expiresAt: expiresAt || null,
      currentVersion: 1
    });
    
    // Add initial version
    document.versions.push({
      version: 1,
      file: {
        url: req.file.path,
        publicId: req.file.filename,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: mimeType
      },
      uploadedBy: req.user.id,
      isCurrent: true
    });
    
    await document.save();
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Error creating document:', error);
    
    // Clean up uploaded file if document creation fails
    if (req.file && req.file.filename) {
      await deleteDocument(req.file.filename).catch(console.error);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create document' 
    });
  }
};

// @desc    Update document (metadata only, not file)
// @route   PUT /api/documents/admin/:id
// @access  Private/Admin
const updateDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }
    
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    const {
      title,
      description,
      category,
      tags,
      accessLevel,
      isPublic,
      expiresAt,
      isActive,
      isArchived
    } = req.body;
    
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (tags !== undefined) {
      const tagArray = typeof tags === 'string' 
        ? tags.split(',').map(t => t.trim()).filter(t => t)
        : Array.isArray(tags) ? tags : [];
      document.tags = tagArray;
    }
    if (accessLevel) document.accessLevel = accessLevel;
    if (isPublic !== undefined) document.isPublic = isPublic === 'true' || isPublic === true;
    if (expiresAt !== undefined) document.expiresAt = expiresAt || null;
    if (isActive !== undefined) document.isActive = isActive === 'true' || isActive === true;
    if (isArchived !== undefined) document.isArchived = isArchived === 'true' || isArchived === true;
    
    document.lastModifiedBy = req.user.id;
    await document.save();
    
    res.json({ 
      success: true, 
      message: 'Document updated successfully', 
      data: document 
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update document' 
    });
  }
};

// @desc    Upload new version of document
// @route   POST /api/documents/admin/:id/version
// @access  Private/Admin
const uploadNewVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'File is required' 
      });
    }
    
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Mark old version as not current
    document.versions.forEach(v => v.isCurrent = false);
    
    // Increment version
    const newVersion = document.currentVersion + 1;
    
    // Get file extension and MIME type
    const fileExtension = getFileExtension(req.file.originalname);
    const mimeType = getMimeType(fileExtension) || req.file.mimetype;
    
    // Add new version
    document.versions.push({
      version: newVersion,
      file: {
        url: req.file.path,
        publicId: req.file.filename,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: mimeType
      },
      uploadedBy: req.user.id,
      changeNotes: req.body.changeNotes || '',
      isCurrent: true
    });
    
    // Update current file
    document.file = {
      url: req.file.path,
      publicId: req.file.filename,
      fileName: req.file.originalname,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: mimeType,
      fileExtension: fileExtension
    };
    
    document.currentVersion = newVersion;
    document.lastModifiedBy = req.user.id;
    await document.save();
    
    res.json({ 
      success: true, 
      message: 'New version uploaded successfully', 
      data: document 
    });
  } catch (error) {
    console.error('Error uploading new version:', error);
    
    // Clean up uploaded file if version upload fails
    if (req.file && req.file.filename) {
      await deleteDocument(req.file.filename).catch(console.error);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload new version' 
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/admin/:id
// @access  Private/Admin
const deleteDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Delete all versions from Cloudinary
    const publicIds = [
      document.file.publicId,
      ...document.versions.map(v => v.file.publicId)
    ].filter(id => id);
    
    // Delete files from Cloudinary
    for (const publicId of publicIds) {
      await deleteDocument(publicId).catch(console.error);
    }
    
    await document.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete document' 
    });
  }
};

// @desc    Download document
// @route   GET /api/documents/admin/:id/download
// @access  Private/Admin
const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    // Update last accessed
    document.lastAccessedAt = new Date();
    await document.save();
    
    // Return download URL
    res.json({
      success: true,
      data: {
        url: document.file.url,
        fileName: document.file.fileName,
        fileSize: document.file.fileSize,
        mimeType: document.file.mimeType
      }
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download document' 
    });
  }
};

// @desc    Get document categories
// @route   GET /api/documents/admin/categories
// @access  Private/Admin
const getDocumentCategories = async (req, res) => {
  try {
    const categories = [
      'contracts',
      'quotes',
      'invoices',
      'reports',
      'policies',
      'certificates',
      'legal',
      'marketing',
      'other'
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch categories' 
    });
  }
};

// @desc    Get document file types
// @route   GET /api/documents/admin/file-types
// @access  Private/Admin
const getDocumentFileTypes = async (req, res) => {
  try {
    const fileTypes = await Document.distinct('file.fileExtension');
    
    res.json({
      success: true,
      data: fileTypes
    });
  } catch (error) {
    console.error('Error fetching file types:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch file types' 
    });
  }
};

module.exports = {
  getDocumentStats,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  uploadNewVersion,
  deleteDocumentById,
  downloadDocument,
  getDocumentCategories,
  getDocumentFileTypes
};


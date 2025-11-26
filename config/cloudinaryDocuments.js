const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary for documents (different from images)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log('📤 Cloudinary storage params for:', file.originalname);
    return {
      folder: 'bristol-utilities/documents',
      resource_type: 'raw', // Important: 'raw' for non-image files
      // Don't use allowed_formats with resource_type: 'raw'
      // It causes issues with file uploads
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`, // Remove extension, Cloudinary adds it back
      // No transformations for documents (keep original)
    };
  },
});

// Configure multer for document uploads
const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname,
      encoding: file.encoding
    });
    
    // Allowed file types
    const allowedMimeTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-zip-compressed',
      'application/octet-stream',
      // Images (for document previews)
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    // Allowed file extensions (fallback check)
    const allowedExtensions = [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'txt', 'csv', 'zip', 'rar',
      'jpg', 'jpeg', 'png', 'gif', 'webp'
    ];
    
    // Get file extension
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    // Check MIME type first
    if (allowedMimeTypes.includes(file.mimetype)) {
      console.log('✅ File accepted by MIME type:', file.mimetype);
      cb(null, true);
    } 
    // Fallback: Check file extension
    else if (allowedExtensions.includes(fileExtension)) {
      console.log('✅ File accepted by extension:', fileExtension);
      console.log('⚠️  MIME type was:', file.mimetype);
      cb(null, true);
    } 
    // Reject
    else {
      console.error('❌ File type rejected');
      console.error('MIME type:', file.mimetype);
      console.error('Extension:', fileExtension);
      console.error('Allowed MIME types:', allowedMimeTypes);
      console.error('Allowed extensions:', allowedExtensions);
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

// Helper function to delete document from Cloudinary
const deleteDocument = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw' // Important for non-image files
    });
    return result;
  } catch (error) {
    console.error('Error deleting document from Cloudinary:', error);
    throw error;
  }
};

// Helper function to get file extension from filename
const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

// Helper function to get MIME type from extension
const getMimeType = (extension) => {
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[extension] || 'application/octet-stream';
};

module.exports = {
  cloudinary,
  documentUpload,
  deleteDocument,
  getFileExtension,
  getMimeType
};


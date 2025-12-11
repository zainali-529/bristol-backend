const { uploadAttachments } = require('../config/cloudinaryAttachments');

const uploadMiddleware = (req, res, next) => {
  const upload = uploadAttachments.array('attachments', 5);
  
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: 'File size exceeds 10MB limit' 
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          success: false, 
          message: 'Maximum 5 files allowed per upload' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'File upload failed' 
      });
    }

    if (req.files && req.files.length > 0) {
      req.uploadedFiles = req.files.map(file => ({
        url: file.path,
        filename: file.originalname,
        fileType: file.mimetype,
        size: file.size,
      }));
    } else {
      req.uploadedFiles = [];
    }

    next();
  });
};

module.exports = { uploadMiddleware };

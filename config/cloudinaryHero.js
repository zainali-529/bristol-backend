const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Video storage configuration
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bristol-utilities/hero/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'mov'],
    // No transformation for videos (keep original quality)
  },
});

// Image storage configuration
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bristol-utilities/hero/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1920, height: 1080, crop: 'fill', quality: 'auto:best' }
    ]
  },
});

// Video upload configuration
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WEBM, and MOV videos are allowed.'), false);
    }
  },
});

// Image upload configuration
const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'), false);
    }
  },
});

// Helper function to delete hero video from Cloudinary
const deleteHeroVideo = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });
    return result;
  } catch (error) {
    console.error('Error deleting hero video from Cloudinary:', error);
    throw error;
  }
};

// Helper function to delete hero image from Cloudinary
const deleteHeroImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    });
    return result;
  } catch (error) {
    console.error('Error deleting hero image from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  videoUpload,
  imageUpload,
  deleteHeroVideo,
  deleteHeroImage
};



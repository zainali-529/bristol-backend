const jwt = require('jsonwebtoken');
const { validateAdminCredentials, getAdminInfo } = require('../config/adminCredentials');
const config = require('../config/config');

// @desc    Admin login
// @route   POST /api/v1/admin/auth/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Validate credentials against static admin credentials
    const isValidCredentials = validateAdminCredentials(email, password);

    if (!isValidCredentials) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Get admin info (without password)
    const adminInfo = getAdminInfo();

    // Create JWT token
    const token = jwt.sign(
      { 
        id: 'admin_001', // Static admin ID
        email: adminInfo.email,
        role: adminInfo.role,
        name: adminInfo.name
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRE }
    );

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: adminInfo
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/v1/admin/auth/profile
// @access  Private (Admin only)
const getAdminProfile = async (req, res) => {
  try {
    // Admin info is already available from the auth middleware
    const adminInfo = getAdminInfo();
    
    res.status(200).json({
      success: true,
      admin: {
        ...adminInfo,
        id: 'admin_001'
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin profile'
    });
  }
};

// @desc    Admin logout (client-side token removal)
// @route   POST /api/v1/admin/auth/logout
// @access  Private (Admin only)
const adminLogout = async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // This endpoint is just for consistency and can be used for logging purposes
    
    res.status(200).json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin logout'
    });
  }
};

module.exports = {
  adminLogin,
  getAdminProfile,
  adminLogout
};
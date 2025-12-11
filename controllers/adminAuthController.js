const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validateAdminCredentials, getAdminInfo, ADMIN_CREDENTIALS, setAdminPassword, updateAdminProfile } = require('../config/adminCredentials');
const config = require('../config/config');
const { sendEmail, emailTemplates } = require('../services/emailService');

// In-memory password reset token store for single admin
let resetToken = null;
let resetTokenExpiry = null;

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
  adminLogout,
  // New endpoints
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Please provide email' });
      }

      const adminEmail = ADMIN_CREDENTIALS.email || config.ADMIN_EMAIL;
      if (email !== adminEmail) {
        return res.status(404).json({ success: false, message: 'Admin email not found' });
      }

      // Generate token valid for 30 minutes
      resetToken = crypto.randomBytes(32).toString('hex');
      resetTokenExpiry = Date.now() + 30 * 60 * 1000;

      const clientUrl = config.CLIENT_URL || '';
      const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

      await sendEmail({
        to: adminEmail,
        subject: 'Reset your Bristol Utilities admin password',
        html: emailTemplates.passwordReset(resetUrl),
      });

      return res.status(200).json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ success: false, message: 'Server error during password reset request' });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
      }
      if (!resetToken || !resetTokenExpiry || Date.now() > resetTokenExpiry) {
        return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' });
      }
      if (token !== resetToken) {
        return res.status(400).json({ success: false, message: 'Invalid reset token' });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }

      // Update in-memory admin password
      setAdminPassword(newPassword);

      // Invalidate token
      resetToken = null;
      resetTokenExpiry = null;

      return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ success: false, message: 'Server error during password reset' });
    }
  },
  updateProfile: async (req, res) => {
    try {
      const { name, currentPassword, newPassword } = req.body;

      if (!name && !newPassword) {
        return res.status(400).json({ success: false, message: 'Provide data to update' });
      }

      if (name) {
        updateAdminProfile({ name });
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required to change password' });
        }
        const isValid = validateAdminCredentials(ADMIN_CREDENTIALS.email, currentPassword);
        if (!isValid) {
          return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        if (String(newPassword).length < 6) {
          return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
        }
        setAdminPassword(newPassword);
      }

      const adminInfo = getAdminInfo();
      return res.status(200).json({ success: true, message: 'Profile updated successfully', admin: adminInfo });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ success: false, message: 'Server error while updating profile' });
    }
  }
};

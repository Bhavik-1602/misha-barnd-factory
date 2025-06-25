// Import dependencies
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../../../models/admin/admin.js';
import sendEmail from '../../../utils/sendemail/sendemail.js';
import { successResponse, errorResponse } from '../../../utils/responseHandler/responseHandler.js';
import { STATUS } from '../../../config/constant/status/status.js';
import { MESSAGES } from '../../../config/constant/admin/adminMessage.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
} from '../../../validation/admin/authValidation/authValidation.js';
import EmailTemplates, {
  getPasswordResetTemplate,
  getPasswordChangeTemplate,
} from '../../../utils/emailTemplates/emailTemplate.js';

// ============================
// Helper: Generate JWT Token
// ============================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ==================================
// @desc    Register new admin
// @route   POST /api/admin/register
// ==================================
export const register = async (req, res) => {
  try {
    const { error } = registerValidation.validate(req.body);
    if (error) {
      return errorResponse(res, MESSAGES.VALIDATION_ERROR, STATUS.BAD_REQUEST, error.details[0].message);
    }

    const { name, email, password, role } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return errorResponse(res, MESSAGES.EMAIL_EXISTS, STATUS.BAD_REQUEST);
    }

    const admin = await Admin.create({ name, email, password, role: role || 'admin' });

    const token = generateToken(admin._id);

    return successResponse(
      res,
      MESSAGES.REGISTER_SUCCESS,
      {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          mobileNumber: admin.mobileNumber, // Ensure this is included
          createdAt: admin.createdAt,
        },
      },
      STATUS.CREATED
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, MESSAGES.SERVER_ERROR, STATUS.SERVER_ERROR);
  }
};

// ===============================
// @desc    Admin login
// @route   POST /api/admin/login
// ===============================
export const login = async (req, res) => {
  try {
    const { error } = loginValidation.validate(req.body);
    if (error) {
      return res.status(STATUS.BAD_REQUEST).json({
        status: STATUS.BAD_REQUEST,
        message: MESSAGES.VALIDATION_ERROR,
        admin: { error: error.details[0].message }
      });
    }

    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin || !admin.isActive) {
      return res.status(STATUS.UNAUTHORIZED).json({
        status: STATUS.UNAUTHORIZED,
        message: MESSAGES.INVALID_CREDENTIALS,
        admin: null
      });
    }

    const isPasswordMatch = await admin.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(STATUS.UNAUTHORIZED).json({
        status: STATUS.UNAUTHORIZED,
        message: MESSAGES.INVALID_CREDENTIALS,
        admin: null
      });
    }

    const token = generateToken(admin._id);

    return res.status(STATUS.OK).json({
      statusCode: STATUS.OK,
      message: MESSAGES.LOGIN_SUCCESS,
      
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          mobileNumber: admin.mobileNumber,
          createdAt: admin.createdAt,
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return res.status(STATUS.SERVER_ERROR).json({
      status: STATUS.SERVER_ERROR,
      message: MESSAGES.SERVER_ERROR,
      admin: null
    });
  }
};

// ============================================
// @desc    Forgot password (send reset link)
// @route   POST /api/admin/forgot-password
// ============================================
export const forgotPassword = async (req, res) => {
  try {
    const { error } = forgotPasswordValidation.validate(req.body);
    if (error) {
      return errorResponse(res, `Validation error: ${error.details[0].message}`, STATUS.BAD_REQUEST);
    }

    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      // Return success response even if email is not found (security measure)
      return successResponse(res, 'If the email exists, a reset link has been sent', {}, STATUS.OK);
    }

    // Generate and save reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    admin.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    admin.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await admin.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Send password reset email
    await EmailTemplates.sendPasswordResetEmail(
      admin.email,
      'Password Reset Request',
      getPasswordResetTemplate(admin.name, resetUrl),
      true
    );

    return successResponse(res, 'Password reset link sent', { email: admin.email }, STATUS.OK);
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 'Server error', STATUS.SERVER_ERROR);
  }
};

// ===================================
// @desc    Reset password using token
// @route   POST /api/admin/reset-password
// ===================================
export const resetPassword = async (req, res) => {
  try {
    const { error } = resetPasswordValidation.validate(req.body);
    if (error) {
      return errorResponse(res, `Validation error: ${error.details[0].message}`, STATUS.BAD_REQUEST);
    }

    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return errorResponse(res, MESSAGES.TOKEN_INVALID, STATUS.BAD_REQUEST);
    }

    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    await admin.save();

    // Send confirmation email
    await EmailTemplates.sendPasswordChangedEmail({ email: admin.email, name: admin.name });

    const jwtToken = generateToken(admin._id);

    return successResponse(res, MESSAGES.RESET_SUCCESS, {
      token: jwtToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    }, STATUS.OK);
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 'Server error', STATUS.SERVER_ERROR);
  }
};

// =======================================
// @desc    Change password (authenticated)
// @route   PUT /api/admin/change-password
// =======================================
export const changePassword = async (req, res) => {
  try {
    const { error } = changePasswordValidation.validate(req.body);
    if (error) {
      return errorResponse(res, `Validation error: ${error.details[0].message}`, STATUS.BAD_REQUEST);
    }

    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id).select('+password');

    if (!admin) {
      return errorResponse(res, 'Admin not found', STATUS.NOT_FOUND);
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, MESSAGES.CURRENT_PASSWORD_INCORRECT, STATUS.BAD_REQUEST);
    }

    admin.password = newPassword;
    await admin.save();

    await EmailTemplates.sendPasswordChangedEmail({ email: admin.email, name: admin.name });

    return successResponse(res, MESSAGES.PASSWORD_CHANGED, { email: admin.email }, STATUS.OK);
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 'Server error', STATUS.SERVER_ERROR);
  }
};

// =============================
// @desc    Get admin profile
// @route   GET /api/admin/profile
// =============================
export const getprofile = async (req, res) => {
  try {
    return res.status(STATUS.OK).json({
      statusCode: STATUS.OK,
      success: true,
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        image: req.admin.image,
        mobileNumber: req.admin.mobileNumber,
        createdAt: req.admin.createdAt,
        updatedAt: req.admin.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, MESSAGES.SERVER_ERROR, STATUS.SERVER_ERROR);
  }
};

// =======================================
// @desc    Update admin profile
// @route   PUT /api/admin/profile
// =======================================
export const updateProfile = async (req, res) => {
  try {
    const { error } = updateProfileValidation.validate(req.body);
    if (error) {
      return errorResponse(res, `Validation error: ${error.details[0].message}`, STATUS.BAD_REQUEST);
    }

    const { name, email,mobileNumber } = req.body;
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return errorResponse(res, 'Admin not found', STATUS.NOT_FOUND);
    }

    // Check if new email is already in use
    if (email && email !== admin.email) {
      const existing = await Admin.findOne({ email });
      if (existing) {
        return errorResponse(res, MESSAGES.EMAIL_EXISTS, STATUS.BAD_REQUEST);
      }
    }

    // Check if new mobile number is already in use
    if (mobileNumber && mobileNumber !== admin.mobileNumber) {
      const existingMobile = await Admin.findOne({ mobileNumber });
      if (existingMobile) {
        return errorResponse(res, 'Mobile number already exists', STATUS.BAD_REQUEST);
      }
    }

    // Update values
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (mobileNumber !== undefined) admin.mobileNumber = mobileNumber;

    if (req.file) {
      admin.image = `/Uploads/${req.file.filename}`;
    } else if (req.body.image) {
      admin.image = req.body.image; // If it's a direct URL
    }

    await admin.save();

    return successResponse(res, 'Profile updated successfully', {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        image: admin.image,
        mobileNumber: admin.mobileNumber,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    }, STATUS.OK);
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 'Server error', STATUS.SERVER_ERROR);
  }
};

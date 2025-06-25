import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Mongoose schema for Admin model
 * @typedef {Object} AdminSchema
 */
const adminSchema = new mongoose.Schema(
  {
    /**
     * Admin's full name
     */
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    /**
     * Admin's email address (unique and lowercase)
     */
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },

    /**
     * Admin's hashed password (not selected by default)
     */
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    /**
     * URL or path to admin's profile image
     */
    image: {
      type: String,
      default: null, // Can be updated to a default image URL if needed
    },

    /**
     * Admin's role in the system
     */
    role: {
      type: String,
      enum: ['admin', 'super-admin'],
      default: 'admin',
    },

    /**
     * Token for password reset
     */
    resetPasswordToken: {
      type: String,
    },

    /**
     * Expiration date for password reset token
     */
    resetPasswordExpire: {
      type: Date,
    },

    /**
     * Indicates if the admin account is active
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    mobileNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values while maintaining uniqueness
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid mobile number (e.g., +1234567890)'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

/**
 * Pre-save middleware to hash password before saving
 * @param {Function} next - Mongoose middleware next function
 */
adminSchema.pre('save', async function (next) {
  // Skip if password is not modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare candidate password with stored hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method to generate a password reset token
 * @returns {string} Reset token (unhashed)
 */
adminSchema.methods.getResetPasswordToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and store in schema
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expiration to 10 minutes from now
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/**
 * Mongoose model for Admin
 * @type {mongoose.Model}
 */
const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getprofile,
  updateProfile,
} from '../../../controllers/admin/authController/authController.js';
import auth from '../../../middlewares/admin/auth/auth.js';
import { validateRequest } from '../../../middlewares/admin/validaterequest/validateRequest.js';
import { uploadProfileImage } from '../../../middlewares/multerConfig.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
} from '../../../validation/admin/authValidation/authValidation.js';

// Initialize Express router
const router = express.Router();

/**
 * @desc    Public routes for admin authentication and password management
 */

/**
 * @route   POST /api/admin/register
 * @desc    Register a new admin
 * @access  Public
 */
router.post('/register', validateRequest(registerValidation), register);

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin and return JWT
 * @access  Public
 */
router.post('/login', validateRequest(loginValidation), login);

/**
 * @route   POST /api/admin/forgot-password
 * @desc    Initiate password reset process
 * @access  Public
 */
router.post('/forgot-password', validateRequest(forgotPasswordValidation), forgotPassword);

/**
 * @route   POST /api/admin/reset-password
 * @desc    Reset admin password using reset token
 * @access  Public
 */
router.post('/reset-password', validateRequest(resetPasswordValidation), resetPassword);

/**
 * @desc    Protected routes requiring authentication
 */

/**
 * @route   PUT /api/admin/change-password
 * @desc    Change authenticated admin's password
 * @access  Private (Admin)
 */
router.put('/change-password', auth, validateRequest(changePasswordValidation), changePassword);

/**
 * @route   GET /api/admin/profile
 * @desc    Retrieve authenticated admin's profile
 * @access  Private (Admin)
 */
router.get('/profile', auth, getprofile);

/**
 * @route   PUT /api/admin/UpdateProfile
 * @desc    Update authenticated admin's profile, including profile image
 * @access  Private (Admin)
 */
router.put('/UpdateProfile', auth, uploadProfileImage, validateRequest(updateProfileValidation), updateProfile);

export default router;
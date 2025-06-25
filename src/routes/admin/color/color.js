// Import required modules and controllers
import express from 'express';
import {
  createColor,
  getColors,
  getColorById,
  updateColor,
  deleteColor
} from '../../../controllers/admin/color/color.js';

import { validateResource } from '../../../middlewares/admin/validate/validate.js';
import auth from '../../../middlewares/admin/auth/auth.js';

// Initialize express router
const router = express.Router();

/**
 * @route   GET /api/v1/color/
 * @desc    Get all colors
 * @access  Public
 */
router.get('/', getColors);

/**
 * @route   GET /api/v1/color/:id
 * @desc    Get color by ID
 * @access  Public
 */
router.get('/:id', getColorById);

/**
 * @route   POST /api/v1/color/
 * @desc    Create a new color
 * @access  Admin (Protected)
 */
router.post(
  '/',
  auth,
  validateResource('color'),  // Optional: You can remove this if it's not needed during creation
  createColor
);

/**
 * @route   PUT /api/v1/color/:id
 * @desc    Update a color by ID
 * @access  Admin (Protected)
 */
router.put(
  '/:id',
  auth,
  validateResource('color'),
  updateColor
);

/**
 * @route   DELETE /api/v1/color/:id
 * @desc    Delete a color by ID
 * @access  Admin (Protected)
 */
router.delete('/:id', auth, deleteColor);

// Export the router to be used in the main app
export default router;

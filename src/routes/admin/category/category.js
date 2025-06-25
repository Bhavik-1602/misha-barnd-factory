// Import required modules and controllers
import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  parseJsonFields
} from '../../../controllers/admin/category/category.js';

import { validateResource } from '../../../middlewares/admin/validate/validate.js';
import { uploadCategoryImages } from '../../../middlewares/multerConfig.js';
import auth from '../../../middlewares/admin/auth/auth.js';

// Initialize express router
const router = express.Router();

/**
 * @route   GET /api/v1/category/
 * @desc    Get all categories (Public Route)
 * @access  Public
 */
router.get('/', getCategories);

/**
 * @route   GET /api/v1/category/:id
 * @desc    Get a single category by ID
 * @access  Admin (Protected)
 */
router.get('/:id', auth, getCategoryById);

/**
 * @route   POST /api/v1/category/
 * @desc    Create a new category
 * @access  Admin (Protected)
 */
router.post(
  '/',
  auth,
  uploadCategoryImages,                  // Handle category image uploads
  parseJsonFields(['sizes']),            // Parse specific JSON fields like 'sizes'
  createCategory
);

/**
 * @route   PUT /api/v1/category/:id
 * @desc    Update an existing category
 * @access  Admin (Protected)
 */
router.put(
  '/:id',
  auth,
  uploadCategoryImages,
  parseJsonFields(['sizes']),
  validateResource('category'),
  updateCategory
);

/**
 * @route   DELETE /api/v1/category/:id
 * @desc    Delete a category by ID
 * @access  Admin (Protected)
 */
router.delete('/:id', auth, deleteCategory);

// Export the router to be used in the main app
export default router;

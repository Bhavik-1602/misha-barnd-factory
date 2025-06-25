import express from 'express';
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from '../../../controllers/admin/brand/brand.js';
import { validateResource } from '../../../middlewares/admin/validate/validate.js';
import auth from '../../../middlewares/admin/auth/auth.js';

// Initialize Express router
const router = express.Router();

/**
 * @desc    Public routes for brand retrieval
 */

/**
 * @route   GET /api/brands
 * @desc    Retrieve a list of all brands
 * @access  Public
 */
router.get('/', getBrands);

/**
 * @route   GET /api/brands/:id
 * @desc    Retrieve a specific brand by ID
 * @access  Public
 */
router.get('/:id', getBrandById);

/**
 * @desc    Protected routes requiring admin authentication
 */

/**
 * @route   POST /api/brands
 * @desc    Create a new brand
 * @access  Private (Admin)
 */
router.post('/', auth, validateResource('brand'), createBrand);

/**
 * @route   PUT /api/brands/:id
 * @desc    Update an existing brand
 * @access  Private (Admin)
 */
router.put('/:id', auth, validateResource('brand'), updateBrand);

/**
 * @route   DELETE /api/brands/:id
 * @desc    Delete a brand by ID
 * @access  Private (Admin)
 */
router.delete('/:id', auth, deleteBrand);

export default router;
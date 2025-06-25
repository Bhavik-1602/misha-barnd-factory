import express from 'express';
import adminRoutes from './admin/auth/auth.js';
import categoryRoutes from './admin/category/category.js';
import productRoutes from './admin/product/product.js';
import customerCategoryRoutes from './customer/customercategory.js';
import customerProductRoutes from './customer/customerproduct.js';
import colorRoutes from './admin/color/color.js';
import brandRoutes from './admin/brand/brand.js';

// Initialize Express router
const router = express.Router();

/**
 * @desc    Customer API routes (public endpoints for frontend)
 * @note    Mounted before admin routes to prioritize customer access
 */

/**
 * @route   /api/customer/v1/customercategory
 * @desc    Routes for retrieving customer categories
 */
router.use('/v1/customercategory', customerCategoryRoutes);

/**
 * @route   /api/customer/v1/customerproducts
 * @desc    Routes for retrieving customer products
 */
router.use('/v1/customerproducts', customerProductRoutes);

/**
 * @desc    Admin and resource API routes (includes public and protected endpoints)
 */

/**
 * @route   /api/v1/admin
 * @desc    Routes for admin authentication and profile management
 */
router.use('/v1/admin', adminRoutes);

/**
 * @route   /api/v1/category
 * @desc    Routes for category management
 */
router.use('/v1/category', categoryRoutes);

/**
 * @route   /api/v1/products
 * @desc    Routes for product management
 */
router.use('/v1/products', productRoutes);

/**
 * @route   /api/v1/color
 * @desc    Routes for color management
 */
router.use('/v1/color', colorRoutes);

/**
 * @route   /api/v1/brand
 * @desc    Routes for brand management
 */
router.use('/v1/brand', brandRoutes);

export default router;
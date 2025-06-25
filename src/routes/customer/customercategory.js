import express from 'express';
import { getCustomerCategory } from '../../controllers/customer/customercategory.js';


// Initialize Express router
const router = express.Router();

/**
 * @desc    Public routes for customer category retrieval
 */

/**
 * @route   GET /api/customer-categories
 * @desc    Retrieve a list of customer categories
 * @access  Public
 */
router.get('/', getCustomerCategory);

// /**
//  * @route   GET /api/customer-categories/:slug
//  * @desc    Retrieve a specific customer category by slug
//  * @access  Public
//  */
// router.get('/:slug', getCategoryBySlug);

export default router;
import express from 'express';
import {
  getCustomerProducts,
  getNewArrivals,
  getCustomerProductById,
  filterCustomerProducts,
  getDealsOfTheMonth
} from '../../controllers/customer/customerproduct.js';

// Initialize Express router
const router = express.Router();

/**
 * @desc    Public routes for customer product retrieval
 */

/**
 * @route   GET /api/customer-products
 * @desc    Retrieve a list of customer products
 * @access  Public
 */
router.get('/', getCustomerProducts);


router.get('/dealsofthemonth', getDealsOfTheMonth);



/**
 * @route   GET /api/customer-products/new-arrivals
 * @desc    Retrieve new arrival products
 * @access  Public
 */
router.get('/new-arrivals', getNewArrivals);

/**
 * @route   GET /api/customer-products/filter
 * @desc    Retrieve filtered customer products based on query parameters
 * @access  Public
 */
router.get('/filter', filterCustomerProducts);

/**
 * @route   GET /api/customer-products/:id
 * @desc    Retrieve a specific product by ID
 * @access  Public
 */
router.get('/:id', getCustomerProductById);



export default router;
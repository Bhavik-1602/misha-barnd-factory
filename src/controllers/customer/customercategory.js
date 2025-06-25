// Customer Category Controller - Get active categories with search, sorting, and pagination

import Category from '../../models/category/category.js';
import asyncHandler from 'express-async-handler';
import { CATEGORY_MESSAGES } from '../../config/constant/category/categoryMessage.js';
import { STATUS } from '../../config/constant/status/status.js';

/**
 * @desc    Fetch active customer categories with optional search and pagination
 * @route   GET /api/customer/categories
 * @access  Public
 */
export const getCustomerCategory = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  // Convert query params to integers
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Base match stage to filter active categories
  const matchStage = { isActive: true };
  let message = CATEGORY_MESSAGES.CATEGORIES_FETCHED;

  // Apply search condition on name or description
  if (search?.trim()) {
    matchStage.$or = [
      { name: { $regex: search.trim(), $options: 'i' } }, // Case-insensitive search on name
      { description: { $regex: search.trim(), $options: 'i' } } // Case-insensitive search on description
    ];
    message = `${CATEGORY_MESSAGES.CATEGORIES_FETCHED} matching "${search}"`;
  }

  try {
    // Aggregation pipeline to fetch filtered and paginated categories
    const pipeline = [
      { $match: matchStage }, // Filter based on active status and search
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          bannerImage: 1,
          icon: 1,
          isActive: 1,
          viewCount: 1,
          sortOrder: 1,
          createdAt: 1,
          updatedAt: 1,
          tags: {
            $cond: {
              if: { $isArray: '$sizes' },
              then: '$sizes.label', // If sizes array exists, return their labels as tags
              else: [] // Otherwise, return an empty array
            }
          }
        }
      },
      { $sort: { viewCount: -1, sortOrder: 1 } }, // Sort by popularity and custom order
      {
        $group: {
          _id: '$slug', // Avoid duplicate categories with same slug
          doc: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } }, // Replace root to simplify final object
      { $skip: skip }, // Pagination - skip
      { $limit: limitNum } // Pagination - limit
    ];

    // Run aggregation
    const categories = await Category.aggregate(pipeline);

    // Total count of categories (without pagination)
    const totalCategories = await Category.countDocuments(matchStage);
    const totalPages = Math.ceil(totalCategories / limitNum);

    // Return paginated response
    res.status(STATUS.OK).json({
      statusCode: STATUS.OK,
      message,
      data: {
        categories,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCategories,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Category fetch/search error:', error);

    res.status(STATUS.SERVER_ERROR).json({
      statusCode: STATUS.SERVER_ERROR,
      message: `${CATEGORY_MESSAGES.CATEGORY_SEARCH_FAILED}: ${error.message}`
    });
  }
});



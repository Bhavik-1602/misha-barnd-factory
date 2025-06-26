import Brand from '../../../models/brand/brand.js';
import Product from '../../../models/product/product.js'; // Import Product model
import asyncHandler from 'express-async-handler';
import { validateBrand } from '../../../validation/admin/brandvalidation/brandvaalidation.js';
import { STATUS } from '../../../config/constant/status/status.js';

// =======================================
// @desc    Create a new brand
// @route   POST /api/admin/brands
// =======================================
export const createBrand = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const existingBrand = await Brand.findOne({ name });
  if (existingBrand) {
    return res.status(STATUS.CONFLICT).json({
      statusCode: STATUS.CONFLICT,
      message: 'Brand already exists',
    });
  }

  const brand = new Brand({ name });
  const createdBrand = await brand.save();

  return res.status(STATUS.CREATED).json({
    statusCode: STATUS.CREATED,
    message: 'Brand created successfully',
    data: createdBrand,
  });
});

// =======================================
// @desc    Get all brands with pagination, search, sorting
// @route   GET /api/admin/brands
// =======================================
export const getBrands = asyncHandler(async (req, res) => {
  const {
    search = '',
    page = 1,
    limit,
    sortBy = 'createdAt',
    sortOrder = -1,
  } = req.query;

  const query = {};
  if (search.trim()) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }

  const pageNum = parseInt(page);
  const limitNum = limit ? parseInt(limit) : undefined;
  const sortOrderNum = parseInt(sortOrder);
  const skip = limitNum ? (pageNum - 1) * limitNum : 0;
  const sort = { [sortBy]: sortOrderNum };

  try {
    const total = await Brand.countDocuments(query);
    let brands;

    const brandQuery = Brand.find(query).sort(sort).lean();

    if (limitNum !== undefined) {
      brands = await brandQuery.skip(skip).limit(limitNum);
      return res.status(STATUS.OK).json({
        statusCode: STATUS.OK,
        message: `Brands fetched successfully${search ? ` matching "${search}"` : ''}`,
        data: {
          brands,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            limit: limitNum,
          },
        },
      });
    }

    brands = await brandQuery;
    return res.status(STATUS.OK).json({
      statusCode: STATUS.OK,
      message: 'All brands fetched successfully',
      data: {
        brands,
        totalItems: total,
      },
    });
  } catch (error) {
    console.error('Get Brands Error:', error);
    return res.status(STATUS.SERVER_ERROR).json({
      statusCode: STATUS.SERVER_ERROR,
      message: `Failed to fetch brands: ${error.message}`,
    });
  }
});

// =======================================
// @desc    Get brand by ID
// @route   GET /api/admin/brands/:id
// =======================================
export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id).lean();

  if (!brand) {
    return res.status(STATUS.NOT_FOUND).json({
      statusCode: STATUS.NOT_FOUND,
      message: 'Brand not found',
    });
  }

  return res.status(STATUS.OK).json({
    statusCode: STATUS.OK,
    message: 'Brand fetched successfully',
    data: brand,
  });
});

// =======================================
// @desc    Update a brand
// @route   PUT /api/admin/brands/:id
// =======================================
export const updateBrand = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(STATUS.NOT_FOUND).json({
      statusCode: STATUS.NOT_FOUND,
      message: 'Brand not found',
    });
  }

  if (name) {
    const existingBrand = await Brand.findOne({ name });
    if (existingBrand && existingBrand._id.toString() !== req.params.id) {
      return res.status(STATUS.CONFLICT).json({
        statusCode: STATUS.CONFLICT,
        message: 'Brand name already exists',
      });
    }
    brand.name = name;
  }

  const updatedBrand = await brand.save();

  return res.status(STATUS.OK).json({
    statusCode: STATUS.OK,
    message: 'Brand updated successfully',
    data: updatedBrand,
  });
});

// =======================================
// @desc    Delete a brand
// @route   DELETE /api/admin/brands/:id
// =======================================
export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(STATUS.NOT_FOUND).json({
      statusCode: STATUS.NOT_FOUND,
      message: 'Brand not found',
    });
  }

  // Check if the brand is used in any product
  const productWithBrand = await Product.findOne({ brand: req.params.id });
  if (productWithBrand) {
    return res.status(STATUS.BAD_REQUEST).json({
      statusCode: STATUS.BAD_REQUEST,
      message: 'Please remove this brand from all products before deleting it.',
    });
  }

  await Brand.deleteOne({ _id: req.params.id });

  return res.status(STATUS.OK).json({
    statusCode: STATUS.OK,
    message: 'Brand deleted successfully',
  });
});
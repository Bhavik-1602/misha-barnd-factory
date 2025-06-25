import Category from '../../../models/category/category.js';
import asyncHandler from 'express-async-handler';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORY_MESSAGES } from '../../../config/constant/category/categoryMessage.js';
import { STATUS } from '../../../config/constant/status/status.js';
import categorySchema from '../../../validation/admin/categoryvalidation/categoryValidation.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import Product from '../../../models/product/product.js';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===========================
// 1. Get All Categories
// ===========================

export const getCategories = asyncHandler(async (req, res) => {
  const { search, page = 1, limit, sizes } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  let message = CATEGORY_MESSAGES.CATEGORIES_FETCHED;

  // If search is provided
  if (search?.trim()) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    message += ` matching "${search}"`;
  }

  // If sizes filter is provided
  if (sizes) {
    try {
      const sizeArray = JSON.parse(sizes).map(size => size.symbol);
      if (sizeArray.length > 0) {
        query['sizes.symbol'] = { $in: sizeArray };
        message += ` with sizes ${sizeArray.join(', ')}`;
      }
    } catch (error) {
      console.error('Invalid sizes parameter:', error);
      res.status(STATUS.BAD_REQUEST);
      throw new Error('Invalid sizes parameter format');
    }
  }

  try {
    const totalCategories = await Category.countDocuments(query);
    let categories;
    let responseData;

    if (limit) {
      categories = await Category.find(query)
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order (latest first)
        .skip(skip)
        .limit(limitNum)
        .lean();
      const totalPages = Math.ceil(totalCategories / limitNum);

      responseData = {
        statusCode: STATUS.OK,
        message,
        data: {
          categories,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems: totalCategories,
            limit: limitNum,
          },
        },
      };
    } else {
      categories = await Category.find(query)
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order (latest first)
        .lean();
      responseData = {
        statusCode: STATUS.OK,
        message: `${message} (all categories)`,
        data: {
          categories,
          totalItems: totalCategories,
        },
      };
    }

    res.status(STATUS.OK).json(responseData);
  } catch (error) {
    console.error('Category fetch/search error:', error);
    res.status(STATUS.SERVER_ERROR);
    throw new Error(`${CATEGORY_MESSAGES.CATEGORY_SEARCH_FAILED}: ${error.message}`);
  }
});

// ===========================
// 2. Middleware - Parse JSON Fields
// ===========================

export const parseJsonFields = (fields) => (req, res, next) => {
  fields.forEach((field) => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Invalid JSON format for ${field}`,
        });
      }
    }
  });
  next();
};

// ===========================
// 3. Create Category
// ===========================

export const createCategory = asyncHandler(async (req, res) => {
  
  const { name, description, isActive, sizes } = req.body;

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    res.status(STATUS.BAD_REQUEST);
    throw new Error(CATEGORY_MESSAGES.CATEGORY_EXISTS);
  }

  let bannerImage = null;
  let bannerImagePublicId = null;
  let icon = null;
  let iconPublicId = null;

if (req.files) {
  if (req.files.bannerImage) {
    try {
      const bannerResult = await cloudinary.uploader.upload(req.files.bannerImage[0].path, {
        folder: 'misha_brand/categories',
      });
      bannerImage = bannerResult.secure_url;
      bannerImagePublicId = bannerResult.public_id;
    } catch (error) {
      console.error('Cloudinary upload error (bannerImage):', error);
      res.status(STATUS.SERVER_ERROR);
      throw new Error('Failed to upload banner image');
    }
  }
  if (req.files.icon) {
    try {
      const iconResult = await cloudinary.uploader.upload(req.files.icon[0].path, {
        folder: 'misha_brand/categories',
      });
      icon = iconResult.secure_url;
      iconPublicId = iconResult.public_id;
    } catch (error) {
      console.error('Cloudinary upload error (icon):', error);
      res.status(STATUS.SERVER_ERROR);
      throw new Error('Failed to upload icon');
    }
  }
}

  const category = new Category({
    name,
    description,
    bannerImage,
    bannerImagePublicId,
    icon,
    iconPublicId,
    isActive: isActive !== undefined ? isActive : true,
    sizes: sizes || [],
  });

  try {
    const createdCategory = await category.save();
    res.status(STATUS.CREATED).json({
      statusCode: STATUS.CREATED,
      message: CATEGORY_MESSAGES.CATEGORY_CREATED,
      data: createdCategory,
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(STATUS.SERVER_ERROR);
    throw new Error(`${CATEGORY_MESSAGES.CATEGORY_CREATION_FAILED}: ${error.message}`);
  }
});

// ===========================
// 4. Update Category
// ===========================

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(STATUS.NOT_FOUND);
    throw new Error(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
  }

  const { error, value } = categorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(STATUS.BAD_REQUEST);
    throw new Error(`${CATEGORY_MESSAGES.VALIDATION_ERROR}: ${error.details.map(x => x.message).join(', ')}`);
  }

  const { name, description, isActive, sizes } = value;

  if (name && name !== category.name) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory && existingCategory._id.toString() !== req.params.id) {
      res.status(STATUS.BAD_REQUEST);
      throw new Error(CATEGORY_MESSAGES.CATEGORY_EXISTS);
    }
    category.slug = slug;
  }

  category.name = name || category.name;
  category.description = description || category.description;
  category.isActive = isActive !== undefined ? isActive : category.isActive;
  category.sizes = sizes || category.sizes;

  if (req.files) {
    // Delete old images from Cloudinary if they exist
    if (req.files.bannerImage && category.bannerImagePublicId) {
      try {
        await cloudinary.uploader.destroy(category.bannerImagePublicId);
      } catch (error) {
        console.error('Error deleting old banner image from Cloudinary:', error);
      }
    }
    if (req.files.icon && category.iconPublicId) {
      try {
        await cloudinary.uploader.destroy(category.iconPublicId);
      } catch (error) {
        console.error('Error deleting old icon from Cloudinary:', error);
      }
    }

    // Update with new images
    if (req.files.bannerImage) {
      category.bannerImage = req.files.bannerImage[0].secure_url;
      category.bannerImagePublicId = req.files.bannerImage[0].public_id;
    }
    if (req.files.icon) {
      category.icon = req.files.icon[0].secure_url;
      category.iconPublicId = req.files.icon[0].public_id;
    }
  }

  try {
    const updatedCategory = await category.save();
    res.status(STATUS.OK).json({
      statusCode: STATUS.OK,
      message: CATEGORY_MESSAGES.CATEGORY_UPDATED,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(STATUS.SERVER_ERROR);
    throw new Error(`${CATEGORY_MESSAGES.CATEGORY_UPDATE_FAILED}: ${error.message}`);
  }
});

// ===========================
// 5. Delete Category
// ===========================




export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(STATUS.NOT_FOUND);
    throw new Error(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
  }

  // Check if there are products associated with this category
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    res.status(STATUS.BAD_REQUEST);
    throw new Error(
      `Cannot delete category because it is associated with ${productCount} product(s). Please delete the products first.`
    );
  }

  // Delete associated images from Cloudinary
  if (category.bannerImagePublicId) {
    try {
      await cloudinary.uploader.destroy(category.bannerImagePublicId);
    } catch (error) {
      console.error('Error deleting banner image from Cloudinary:', error);
    }
  }
  if (category.iconPublicId) {
    try {
      await cloudinary.uploader.destroy(category.iconPublicId);
    } catch (error) {
      console.error('Error deleting icon from Cloudinary:', error);
    }
  }

  // Delete the category
  await Category.deleteOne({ _id: req.params.id });

  res.status(STATUS.OK).json({
    statusCode: STATUS.OK,
    message: CATEGORY_MESSAGES.CATEGORY_DELETED,
  });
});

// ===========================
// 6. Get Category By ID
// ===========================

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(STATUS.NOT_FOUND);
    throw new Error(CATEGORY_MESSAGES.CATEGORY_ID_NOT_FOUND);
  }

  res.status(STATUS.OK).json({
    statusCode: STATUS.OK,
    message: CATEGORY_MESSAGES.CATEGORY_ID_FETCHED,
    data: category,
  });
});
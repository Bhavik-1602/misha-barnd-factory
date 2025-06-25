import Color from '../../../models/color/color.js';
import asyncHandler from 'express-async-handler';
import { STATUS } from '../../../config/constant/status/status.js';

/**
 * @desc    Create a new color
 * @route   POST /api/admin/colors
 * @access  Private
 */
export const createColor = asyncHandler(async (req, res) => {
  const { name, hex } = req.body;

  // Validate required fields
  if (!name || !hex) {
    return res.status(STATUS.BAD_REQUEST).json({
      statuscode: STATUS.BAD_REQUEST,
      message: 'Color name and hex code are required',
    });
  }

  // Check for duplicate color name
  const existingColor = await Color.findOne({ name: name.toLowerCase() });
  if (existingColor) {
    return res.status(STATUS.CONFLICT).json({
      statuscode: STATUS.CONFLICT,
      message: 'Color already exists',
    });
  }

  // Create and save new color
  const color = new Color({ name, hex });
  const createdColor = await color.save();

  res.status(STATUS.CREATED).json({
    statuscode: STATUS.CREATED,
    message: 'Color created successfully',
    data: createdColor,
  });
});

/**
 * @desc    Get all colors with optional pagination, search and sorting
 * @route   GET /api/admin/colors
 * @access  Private
 */
export const getColors = asyncHandler(async (req, res) => {
  const {
    search,
    page = 1,
    limit,
    sortBy = 'createdAt',
    sortOrder = -1,
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = limit ? parseInt(limit) : undefined;
  const sortOrderNum = parseInt(sortOrder);
  const skip = limitNum ? (pageNum - 1) * limitNum : 0;
  const sort = { [sortBy]: sortOrderNum };

  const query = {};
  let message = 'Colors fetched successfully';

  // If search keyword is provided
  if (search?.trim()) {
    query.name = { $regex: search.trim(), $options: 'i' };
    message = `Colors fetched successfully matching "${search}"`;
  }

  try {
    const total = await Color.countDocuments(query);

    // Prepare query with sorting
    const colorQuery = Color.find(query)
      .sort(sort)
      .lean();

    let colors, responseData;

    // Apply pagination if limit provided
    if (limitNum !== undefined) {
      colors = await colorQuery.skip(skip).limit(limitNum);
      const totalPages = Math.ceil(total / limitNum);

      responseData = {
        statusCode: STATUS.OK,
        message,
        data: {
          colors,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems: total,
            limit: limitNum,
          },
        },
      };
    } else {
      // No pagination, return all
      colors = await colorQuery;
      message = 'Colors fetched successfully (all colors)';
      responseData = {
        statusCode: STATUS.OK,
        message,
        data: {
          colors,
          totalItems: total,
        },
      };
    }

    res.status(STATUS.OK).json(responseData);
  } catch (error) {
    console.error('Color fetch/search error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      statusCode: STATUS.SERVER_ERROR,
      message: `Failed to fetch colors: ${error.message}`,
    });
  }
});

/**
 * @desc    Get a color by ID
 * @route   GET /api/admin/colors/:id
 * @access  Private
 */
export const getColorById = asyncHandler(async (req, res) => {
  const color = await Color.findById(req.params.id)
    .lean();

  if (!color) {
    return res.status(STATUS.NOT_FOUND).json({
      statuscode: STATUS.NOT_FOUND,
      message: 'Color not found',
    });
  }

  res.status(STATUS.OK).json({
    statuscode: STATUS.OK,
    message: 'Color fetched successfully',
    data: color,
  });
});

/**
 * @desc    Update a color by ID
 * @route   PUT /api/admin/colors/:id
 * @access  Private
 */
export const updateColor = asyncHandler(async (req, res) => {
  const { name, hex } = req.body;
  const color = await Color.findById(req.params.id);

  if (!color) {
    return res.status(STATUS.NOT_FOUND).json({
      statuscode: STATUS.NOT_FOUND,
      message: 'Color not found',
    });
  }

  // Check if the new name already exists in another record
  if (name) {
    const existingColor = await Color.findOne({ name: name.toLowerCase() });
    if (existingColor && existingColor._id.toString() !== req.params.id) {
      return res.status(STATUS.CONFLICT).json({
        statuscode: STATUS.CONFLICT,
        message: 'Color name already exists',
      });
    }
    color.name = name;
  }

  // Update hex code if provided
  if (hex) {
    color.hex = hex;
  }

  const updatedColor = await color.save();

  res.status(STATUS.OK).json({
    statuscode: STATUS.OK,
    message: 'Color updated successfully',
    data: updatedColor,
  });
});

/**
 * @desc    Delete a color by ID
 * @route   DELETE /api/admin/colors/:id
 * @access  Private
 */
export const deleteColor = asyncHandler(async (req, res) => {
  const color = await Color.findById(req.params.id);

  if (!color) {
    return res.status(STATUS.NOT_FOUND).json({
      statuscode: STATUS.NOT_FOUND,
      message: 'Color not found',
    });
  }

  await Color.deleteOne({ _id: req.params.id });

  res.status(STATUS.OK).json({
    statuscode: STATUS.OK,
    message: 'Color deleted successfully',
  });
});
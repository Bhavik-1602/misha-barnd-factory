import { v2 as cloudinary } from 'cloudinary'
import Product from '../../../models/product/product.js';
import Category from '../../../models/category/category.js';
import Color from '../../../models/color/color.js';
import Brand from '../../../models/brand/brand.js';
import asyncHandler from 'express-async-handler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PRODUCT_MESSAGES } from '../../../config/constant/product/productMessages.js';
import { STATUS } from '../../../config/constant/status/status.js';
import mongoose from 'mongoose';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * @desc    Fetch products with filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res) => {
  // console.log('Query Parameters:', req.query); // Log incoming query params

  const {
    search,
    page = 1,
    limit,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    tags,
  } = req.query;

  if (!search) {
    console.warn('Search parameter missing or undefined'); // Warn if search is missing
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  let message = PRODUCT_MESSAGES.PRODUCTS_FETCHED;

  if (search?.trim()) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
      { tags: { $regex: escapedSearch, $options: 'i' } },
    ];
    message += ` matching "${search}"`;
    console.log('Search Query:', query.$or);
  }

  if (category?.trim()) {
    if (mongoose.isValidObjectId(category)) {
      query.category = new mongoose.Types.ObjectId(category);
    } else {
      const categoryDoc = await Category.findOne({ slug: category, isActive: true }).lean();
      console.log('Category Document:', categoryDoc);
      if (!categoryDoc) {
        res.status(STATUS.BAD_REQUEST);
        throw new Error('Invalid category');
      }
      query.category = categoryDoc._id;
    }
    message += ` in category "${category}"`;
  }

  if (minPrice || maxPrice) {
    query.base_price = {};
    if (minPrice) {
      query.base_price.$gte = parseFloat(minPrice);
      message += ` with price >= ${minPrice}`;
    }
    if (maxPrice) {
      query.base_price.$lte = parseFloat(maxPrice);
      message += ` with price <= ${maxPrice}`;
    }
    console.log('Price Query:', query.base_price);
  }

  if (tags?.trim()) {
    const tagArray = tags.split(',').map((tag) => tag.trim().toLowerCase());
    console.log('Tags Array:', tagArray);
    query.tags = { $all: tagArray };
    message += ` with tags "${tags}"`;
  }

  const sort = {};
  const validSortFields = ['createdAt', 'base_price', 'rating', 'viewCount'];
  if (validSortFields.includes(sortBy)) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }
  console.log('Sort Object:', sort);

  console.log('Constructed Query:', query);

  try {
    const totalProducts = await Product.countDocuments(query);
    console.log('Total Products:', totalProducts);

    let products = await Product.find(query)
      .populate('category', 'name description')
      .populate('brand', 'name description')
      .populate('variants.color', 'name hex')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    console.log('Fetched Products:', products.map(p => p.name)); // Log product names only
    console.log('Pagination:', { pageNum, limitNum, skip, totalProducts });

    const responseData = {
      statusCode: STATUS.OK,
      message,
      data: {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalProducts / limitNum),
          totalItems: totalProducts,
          limit: limitNum,
        },
      },
    };

    res.status(STATUS.OK).json(responseData);
  } catch (error) {
    console.error('Product fetch/search error:', error);
    res.status(STATUS.SERVER_ERROR);
    throw new Error(`${PRODUCT_MESSAGES.SEARCH_FAILED}: ${error.message}`);
  }
});

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin)
 */
export const createProduct = asyncHandler(async (req, res) => {
  // Destructure request body
  let {
    name,
    category,
    brand,
    base_price,
    description,
    variants,
    isActive,
    tags,
    videoUrl,
    isFeatured,
    isSoldOut,
    isVisible,
    specifications,
    collections,
    discount,
    variantImagesMeta,
  } = req.body;

  // Parse JSON fields
const parseJsonField = (field, fieldName) => {
  if (field == null) {
    return fieldName === 'specifications' ? {} : [];
  }
  if (Array.isArray(field)) {
    if (fieldName === 'tags' || fieldName === 'collections') {
      return field.map((item) =>
        typeof item === 'string'
          ? item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          : item
      );
    }
    return field;
  }
  if (fieldName === 'specifications' && typeof field === 'object' && !Array.isArray(field)) {
    return field;
  }
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (fieldName === 'specifications') {
        return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      }
      if (fieldName === 'tags' || fieldName === 'collections') {
        const items = Array.isArray(parsed) ? parsed : [parsed];
        return items.map((item) =>
          typeof item === 'string'
            ? item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            : item
        );
      }
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      if (fieldName === 'specifications') {
        return {};
      }
      if (fieldName === 'tags' || fieldName === 'collections') {
        return [field.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')];
      }
      return [field];
    }
  }
  return fieldName === 'specifications' ? {} : [field];
};

  variants = parseJsonField(variants, 'variants') || [];
  tags = parseJsonField(tags, 'tags') || [];
  specifications = parseJsonField(specifications, 'specifications') || {};
  collections = parseJsonField(collections, 'collections') || [];
  variantImagesMeta = parseJsonField(variantImagesMeta, 'variantImagesMeta') || [];

  // Validate required fields, including at least one variant
  if (!name || !category || !brand || !base_price || variants.length === 0) {
    return res.status(STATUS.UNPROCESSABLE_ENTITY).json({
      statusCode: STATUS.UNPROCESSABLE_ENTITY,
      message: variants.length === 0
        ? 'At least one variant is required'
        : PRODUCT_MESSAGES.VALIDATION_ERROR,
    });
  }

  // Validate category
  const categoryDoc = await Category.findById(category).select('name description').lean();
  if (!categoryDoc) {
    return res.status(STATUS.BAD_REQUEST).json({
      statusCode: STATUS.BAD_REQUEST,
      message: PRODUCT_MESSAGES.INVALID_CATEGORY_ID,
    });
  }

  // Validate brand
  const brandDoc = await Brand.findById(brand).lean();
  if (!brandDoc) {
    return res.status(STATUS.BAD_REQUEST).json({
      statusCode: STATUS.BAD_REQUEST,
      message: 'Invalid brand ID',
    });
  }

  // Validate colors in variants
  if (variants.length > 0) {
    const colorIds = variants.map((v) => v.color).filter(Boolean);
    const validColors = await Color.find({ _id: { $in: colorIds } }).lean();
    if (validColors.length !== colorIds.length) {
      return res.status(STATUS.BAD_REQUEST).json({
        statusCode: STATUS.BAD_REQUEST,
        message: 'One or more colors are invalid',
      });
    }
  }

  // Generate slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const existingProduct = await Product.findOne({ slug }).lean();
  if (existingProduct) {
    return res.status(STATUS.CONFLICT).json({
      statusCode: STATUS.CONFLICT,
      message: PRODUCT_MESSAGES.PRODUCT_EXISTS,
    });
  }

  if (req.files && variants.length > 0) {
    variants = variants.map((variant, index) => {
      const variantImageField = `variants[${index}][image]`;
      if (req.files[variantImageField]) {
        const variantImages = Array.isArray(req.files[variantImageField])
          ? req.files[variantImageField]
          : [req.files[variantImageField]];
        variant.images = variantImages.map((file, i) => ({
        url: file.path, // Cloudinary URL
        public_id: file.filename, // Cloudinary public_id
          alt: req.body[`variants[${index}][imageAlt_${i}]`] || `Variant ${index} Image ${i + 1}`,
          isPrimary: i === 0,
        }));
      } else {
        variant.images = [];
      }
      return variant;
    });
  }

  // Validate that at least one variant has images
  const hasImages = variants.some((v) => v.images?.length > 0);
  if (!hasImages && req.files && Object.keys(req.files).length > 0) {
    return res.status(STATUS.BAD_REQUEST).json({
      statusCode: STATUS.BAD_REQUEST,
      message: 'Uploaded images must be assigned to a variant',
    });
  }

  // Create new product
 const product = new Product({
    name,
    slug,
    category,
    brand,
    base_price,
    description,
    variants,
    isActive: isActive ?? true,
    tags,
    videoUrl,
    isFeatured: isFeatured ?? false,
    isSoldOut: isSoldOut ?? false,
    isVisible: isVisible ?? true,
    specifications,
    collections,
    discount: discount ?? 0,
  });

  try {
    // Start a transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Save the product
      const createdProduct = await product.save({ session });

      // Increment productCount in the category
      await Category.findByIdAndUpdate(
        category,
        { $inc: { productCount: 1 } },
        { session }
      );

      // Increment productCount for each unique color in variants
      const colorIds = [...new Set(variants.map((v) => v.color).filter(Boolean))]; // Get unique color IDs
      if (colorIds.length > 0) {
        await Color.updateMany(
          { _id: { $in: colorIds } },
          { $inc: { productCount: 1 } },
          { session }
        );
      }

      // Commit the transaction
      await session.commitTransaction();

      // Re-fetch with populated fields
      const populatedProduct = await Product.findById(createdProduct._id)
        .populate('category', 'name description')
        .populate('brand', 'name description')
        .populate('variants.color', 'name hex')
        .lean();

      res.status(STATUS.CREATED).json({
        statusCode: STATUS.CREATED,
        message: PRODUCT_MESSAGES.PRODUCT_CREATED,
        data: populatedProduct,
      });
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      statusCode: STATUS.SERVER_ERROR,
      message: `${PRODUCT_MESSAGES.PRODUCT_CREATION_FAILED}: ${error.message}`,
    });
  }
});

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private (Admin)
 */


export const updateProduct = asyncHandler(async (req, res) => {
  // Validate product ID
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(STATUS.BAD_REQUEST).json({
      statusCode: STATUS.BAD_REQUEST,
      message: 'Invalid product ID',
    });
  }

  // Log request body for debugging
  // console.log('Request Body Variants:', JSON.stringify(req.body.variants));

  // Find existing product
  const product = await Product.findById(req.params.id)
    .populate('category', 'name description')
    .populate('variants.color', 'name hex')
    .populate('brand', 'name description');  

  if (!product) {
    return res.status(STATUS.NOT_FOUND).json({
      statusCode: STATUS.NOT_FOUND,
      message: PRODUCT_MESSAGES.PRODUCT_NOT_FOUND,
    });
  }

  // Destructure request body
  let {
    name,
    category,
    brand,
    base_price,
    description,
    variants,
    isActive,
    tags,
    videoUrl,
    isFeatured,
    isSoldOut,
    isVisible,
    specifications,
    collections,
    discount,
  } = req.body;

  // Validate variants
  if (variants && Array.isArray(variants)) {
    for (const variant of variants) {
      if (variant.color && typeof variant.color === 'object') {
        return res.status(STATUS.BAD_REQUEST).json({
          statusCode: STATUS.BAD_REQUEST,
          message: 'Variant color must be a string ID, not an object',
        });
      }
      if (!variant._id && !variant.color) {
        return res.status(STATUS.BAD_REQUEST).json({
          statusCode: STATUS.BAD_REQUEST,
          message: 'Each variant must have either an _id (for updates) or a color (for new variants)',
        });
      }
      if (variant.color && !mongoose.isValidObjectId(variant.color)) {
        return res.status(STATUS.BAD_REQUEST).json({
          statusCode: STATUS.BAD_REQUEST,
          message: `Invalid color ID in variant: ${variant.color}`,
        });
      }
    }
  }

  // Parse JSON fields
  const parseJsonField = (field, fieldName) => {
    if (field == null) {
      return fieldName === 'specifications' ? product.specifications : product[fieldName];
    }
    if (Array.isArray(field)) {
      if (fieldName === 'tags' || fieldName === 'collections') {
        return field.map((item) =>
          typeof item === 'string'
            ? item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            : item
        );
      }
      if (fieldName === 'variants') {
        const parsedVariants = [];
        for (const item of field) {
          if (typeof item === 'string') {
            try {
              const parsed = JSON.parse(item);
              if (Array.isArray(parsed)) {
                parsedVariants.push(...parsed.map(v => ({
                  ...v,
                  color: v.color?._id?.toString() || v.color
                })));
              } else {
                parsedVariants.push({
                  ...parsed,
                  color: parsed.color?._id?.toString() || parsed.color
                });
              }
            } catch {
              throw new Error(`Invalid variant format in array: ${item}`);
            }
          } else if (typeof item === 'object' && item !== null) {
            parsedVariants.push({
              ...item,
              color: item.color?._id?.toString() || item.color
            });
          }
        }
        return parsedVariants;
      }
      return field;
    }
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (fieldName === 'specifications') {
          return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : product.specifications;
        }
        if (fieldName === 'tags' || fieldName === 'collections') {
          const items = Array.isArray(parsed) ? parsed : [parsed];
          return items.map((item) =>
            typeof item === 'string'
              ? item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
              : item
          );
        }
        if (fieldName === 'variants') {
          const parsedVariants = Array.isArray(parsed) ? parsed : [parsed];
          return parsedVariants.map(v => ({
            ...v,
            color: v.color?._id?.toString() || v.color
          }));
        }
        return parsed;
      } catch {
        if (fieldName === 'specifications') {
          const [key, value] = field.split(':').map((str) => str.trim());
          return key && value ? { [key]: value } : product.specifications;
        }
        if (fieldName === 'tags' || fieldName === 'collections') {
          return [field.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')];
        }
        throw new Error(`Invalid ${fieldName} format: ${field}`);
      }
    }
    if (fieldName === 'specifications') {
      return typeof field === 'object' && !Array.isArray(field) ? field : product.specifications;
    }
    return field;
  };

  const errors = [];
  try {
    variants = variants ? parseJsonField(variants, 'variants') : product.variants;
    tags = tags ? parseJsonField(tags, 'tags') : product.tags;
    specifications = specifications ? parseJsonField(specifications, 'specifications') : product.specifications;
    collections = collections ? parseJsonField(collections, 'collections') : product.collections;
  } catch (error) {
    errors.push(error.message);
  }

  if (errors.length > 0) {
    return res.status(STATUS.BAD_REQUEST).json({
      statusCode: STATUS.BAD_REQUEST,
      message: errors.join('; '),
    });
  }

  // Validate color IDs for variants
  if (variants && Array.isArray(variants)) {
    const colorIds = variants
      .map((v) => {
        if (typeof v.color === 'object' && v.color?._id) {
          console.warn('Found object in variant.color:', v.color);
          return v.color._id.toString();
        }
        return v.color;
      })
      .filter((color) => color && mongoose.isValidObjectId(color));
    console.log('colorIds:', colorIds);
    const validColors = await Color.find({ _id: { $in: colorIds } });
    if (validColors.length !== colorIds.length) {
      return res.status(STATUS.BAD_REQUEST).json({
        statusCode: STATUS.BAD_REQUEST,
        message: 'One or more colors do not exist',
      });
    }
  }

  // Initialize updated variants
  let updatedVariants = [...product.variants.map((v) => v.toObject())]; // Clone existing variants

  // Merge updated variants based on _id
  if (variants && Array.isArray(variants)) {
    const newVariants = [];
    variants.forEach((variant, index) => {
      if (variant._id && mongoose.isValidObjectId(variant._id)) {
        // Existing variant (has _id)
        const existingVariantIndex = updatedVariants.findIndex(
          (v) => v._id.toString() === variant._id.toString()
        );
        if (existingVariantIndex !== -1) {
          updatedVariants[existingVariantIndex] = {
            ...updatedVariants[existingVariantIndex],
            color: variant.color ?? updatedVariants[existingVariantIndex].color,
            price: variant.price ?? updatedVariants[existingVariantIndex].price,
            sizes: variant.sizes ?? updatedVariants[existingVariantIndex].sizes,
            images: updatedVariants[existingVariantIndex].images, // Preserve images for now
          };
        }
      } else if (variant.color) {
        // New variant (no _id)
        newVariants.push({
          _id: new mongoose.Types.ObjectId(),
          color: variant.color,
          price: variant.price,
          sizes: variant.sizes || [],
          images: variant.images || [],
        });
      }
    });
    updatedVariants = [...updatedVariants, ...newVariants];
  }

  // Handle image uploads for variants
  if (req.files && Object.keys(req.files).length > 0) {
    await Promise.all(updatedVariants.map(async (variant, index) => {
      const variantImageField = `variants[${index}][image]`;
      if (req.files[variantImageField]) {
        const variantImages = Array.isArray(req.files[variantImageField])
          ? req.files[variantImageField]
          : [req.files[variantImageField]];
        
        // Delete old images from Cloudinary for existing variants
        const isExistingVariant = variant._id && product.variants.some(
          (pv) => pv._id.toString() === variant._id.toString()
        );
        if (isExistingVariant && variant.images?.length > 0) {
          for (const img of variant.images) {
            if (img.public_id) {
              try {
                await cloudinary.uploader.destroy(img.public_id);
              } catch (error) {
                console.error(`Failed to delete Cloudinary image ${img.public_id}:`, error);
              }
            }
          }
        }

        // Assign new images
        variant.images = variantImages.map((file, i) => ({
          url: file.path,
          public_id: file.filename,
          alt: req.body[`variants[${index}][imageAlt_${i}]`] || `Variant ${index} Image ${i + 1}`,
          isPrimary: i === 0,
        }));
      }
    }));

    // Validate that at least one variant has images
    const hasImages = updatedVariants.some((v) => v.images?.length > 0);
    if (!hasImages) {
      return res.status(STATUS.BAD_REQUEST).json({
        statusCode: STATUS.BAD_REQUEST,
        message: 'Uploaded images must be assigned to a variant',
      });
    }
  }

  // Update slug if name changes
  let slug = product.slug;
  if (name && name !== product.name) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct && existingProduct._id.toString() !== req.params.id) {
      return res.status(STATUS.CONFLICT).json({
        statusCode: STATUS.CONFLICT,
        message: PRODUCT_MESSAGES.PRODUCT_EXISTS,
      });
    }
  }

  // Start a transaction for atomic updates
const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Determine colors before and after the update
    const oldColorIds = [...new Set(product.variants.map((v) => v.color?._id?.toString()).filter(Boolean))];
    const newColorIds = [...new Set(updatedVariants.map((v) => v.color?.toString()).filter(Boolean))];

    // Colors to increment (added colors)
    const colorsToIncrement = newColorIds.filter((id) => !oldColorIds.includes(id));
    // Colors to decrement (removed colors)
    const colorsToDecrement = oldColorIds.filter((id) => !newColorIds.includes(id));

    // Update product fields
    const updateData = {
      name: name ?? product.name,
      slug,
      category: category ?? product.category._id,
      brand: brand ?? product.brand._id,
      base_price: parseFloat(base_price) || product.base_price,
      description: description ?? product.description,
      variants: updatedVariants,
      isActive: isActive === 'true' || isActive === true ? true : product.isActive,
      tags: tags ?? product.tags,
      videoUrl: videoUrl ?? product.videoUrl,
      isFeatured: isFeatured === 'true' || isFeatured === true ? true : product.isFeatured,
      isSoldOut: isSoldOut === 'false' || isSoldOut === false ? false : product.isSoldOut,
      isVisible: isVisible === 'true' || isVisible === true ? true : product.isVisible,
      specifications: specifications ?? product.specifications,
      collections: collections ?? product.collections,
      discount: parseFloat(discount) || product.discount,
    };

    // Update productCount for category if changed
    if (category && category !== product.category._id.toString()) {
      await Category.findByIdAndUpdate(
        product.category._id,
        { $inc: { productCount: -1 } },
        { session }
      );
      await Category.findByIdAndUpdate(
        category,
        { $inc: { productCount: 1 } },
        { session }
      );
    }

    // Increment productCount for newly added colors
    if (colorsToIncrement.length > 0) {
      await Color.updateMany(
        { _id: { $in: colorsToIncrement } },
        { $inc: { productCount: 1 } },
        { session }
      );
    }

    // Decrement productCount for removed colors
    if (colorsToDecrement.length > 0) {
      await Color.updateMany(
        { _id: { $in: colorsToDecrement } },
        { $inc: { productCount: -1 } },
        { session }
      );
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, session }
    )
      .populate('category', 'name description')
.populate('brand', 'name description')
.populate('variants.color', 'name hex');

    // Commit transaction
    await session.commitTransaction();

    // Transform response to convert ObjectId to strings, remove 'id' fields, and handle dates
    const transformResponse = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map((item) => transformResponse(item));
      }
      if (typeof obj === 'object' && obj !== null) {
        const newObj = { ...obj };
        if (newObj._id && newObj._id.buffer) {
          newObj._id = new mongoose.Types.ObjectId(newObj._id.buffer).toString();
        } else if (newObj._id && typeof newObj._id === 'object' && newObj._id.toString) {
          newObj._id = newObj._id.toString();
        }
        if (newObj.createdAt && newObj.createdAt instanceof Date) {
          newObj.createdAt = newObj.createdAt.toISOString();
        }
        if (newObj.updatedAt && newObj.updatedAt instanceof Date) {
          newObj.updatedAt = newObj.updatedAt.toISOString();
        }
        delete newObj.id;
        Object.keys(newObj).forEach((key) => {
          newObj[key] = transformResponse(newObj[key]);
        });
        return newObj;
      }
      return obj;
    };

    const cleanedProduct = transformResponse(updatedProduct.toJSON({ virtuals: false }));

    res.status(STATUS.OK).json({
      statusCode: STATUS.OK,
      message: PRODUCT_MESSAGES.PRODUCT_UPDATED,
      data: cleanedProduct,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Product update error:', error.message);
    res.status(STATUS.SERVER_ERROR).json({
      statusCode: STATUS.SERVER_ERROR,
      message: `${PRODUCT_MESSAGES.PRODUCT_UPDATE_FAILED}: ${error.message}`,
    });
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  // Find product
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(STATUS.NOT_FOUND).json({
      statusCode: STATUS.NOT_FOUND,
      message: PRODUCT_MESSAGES.PRODUCT_NOT_FOUND,
    });
  }

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete associated images
    const uploadsDir = path.join(__dirname, '../../../Uploads');
    product.variants.forEach(variant => {
      variant.images?.forEach(img => {
        const imagePath = path.join(uploadsDir, path.basename(img.url));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    });

    // Decrease productCount in the category
    await Category.findByIdAndUpdate(
      product.category,
      { $inc: { productCount: -1 } },
      { session }
    );

    // Decrease productCount for each unique color in variants
    const colorIds = [...new Set(product.variants.map((v) => v.color?._id?.toString()).filter(Boolean))];
    if (colorIds.length > 0) {
      await Color.updateMany(
        { _id: { $in: colorIds } },
        { $inc: { productCount: -1 } },
        { session }
      );
    }

    // Delete product
    Image
    await Product.deleteOne({ _id: req.params.id }, { session });

    // Commit transaction
    await session.commitTransaction();

    res.status(STATUS.OK).json({
      statusCode: STATUS.OK,
      message: PRODUCT_MESSAGES.PRODUCT_DELETED,
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Fetch a single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('categoryDetails')
    .populate('variants.color')
    .populate('brand')
    .lean();

  if (!product) {
    return res.status(STATUS.NOT_FOUND).json({
      statusCode: STATUS.NOT_FOUND,
      message: PRODUCT_MESSAGES.PRODUCT_ID_NOT_FOUND,
    });
  }

  await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

  res.status(STATUS.OK).json({
    statusCode: STATUS.OK,
    message: PRODUCT_MESSAGES.PRODUCT_ID_FETCHED,
    data: product,
  });
});

const buildSearchQuery = async (search) => {
  const query = { isActive: true };
  let message = PRODUCT_MESSAGES.PRODUCTS_FETCHED;

  if (search?.trim()) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
      { tags: { $regex: escapedSearch, $options: 'i' } },
    ];
    message += ` matching "${search}"`;
    console.log('Search Query:', query.$or);
  }

  return { query, message };
};

/**
 * @desc    Search products by text
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = asyncHandler(async (req, res) => {
  console.log('Search Query Parameters:', req.query);

  const { search, page = 1, limit = 10 } = req.query;

  if (!search?.trim()) {
    return res.status(STATUS.BAD_REQUEST).json({
      statusCode: STATUS.BAD_REQUEST,
      message: 'Search term is required',
    });
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  try {
    const { query, message } = await buildSearchQuery(search);

    const totalProducts = await Product.countDocuments(query);
    console.log('Total Products:', totalProducts);

    const products = await Product.find(query)
      .populate('category', 'name description')
      .populate('brand', 'name description')
      .populate('variants.color', 'name hex')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    console.log('Fetched Products:', products.map(p => p.name));

    res.status(STATUS.OK).json({
      statusCode: STATUS.OK,
      message,
      data: {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalProducts / limitNum),
          totalItems: totalProducts,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      statusCode: STATUS.SERVER_ERROR,
      message: `${PRODUCT_MESSAGES.SEARCH_FAILED}: ${error.message}`,
    });
  }
});
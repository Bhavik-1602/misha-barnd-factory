import Product from '../../models/product/product.js';
import Category from '../../models/category/category.js';
import Color from '../../models/color/color.js';
import Brand from '../../models/brand/brand.js';
import asyncHandler from 'express-async-handler';
import { PRODUCT_MESSAGES } from '../../config/constant/product/productMessages.js';
import { STATUS } from '../../config/constant/status/status.js';
import mongoose from 'mongoose';

/**
 * @desc    Fetch a single product by ID for customers
 * @route   GET /api/customer/v1/products/:id
 * @access  Public
 */
export const getCustomerProductById = asyncHandler(async (req, res) => {
  // Validate product ID
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(STATUS.BAD_REQUEST).json({
      statuscode: STATUS.BAD_REQUEST,
      message: 'Invalid product ID',
    });
  }

  // Fetch product with populated fields, only visible and non-sold-out products
  const product = await Product.findOne({ 
    _id: req.params.id,
    isVisible: true,
    isSoldOut: false 
  })
    .populate('category', 'name slug')
    .populate('variants.color', 'name hex')
    .populate('brand', 'name slug')
    .lean();

  if (!product) {
    return res.status(STATUS.NOT_FOUND).json({
      statuscode: STATUS.NOT_FOUND,
      message: PRODUCT_MESSAGES.PRODUCT_ID_NOT_FOUND,
    });
  }

  // Increment view count
  await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

  res.status(STATUS.OK).json({
    statuscode: STATUS.OK,
    message: PRODUCT_MESSAGES.PRODUCT_ID_FETCHED,
    data: product,
  });
});

/**
 * @desc    Fetch products for customers with filtering, sorting, and pagination
 * @route   GET /api/customer/v1/products
 * @access  Public
 */
export const getCustomerProducts = asyncHandler(async (req, res) => {
  const {
    search,
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    tags,
    colors,
    brands,
    collections,
    size
  } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  // Initialize query for visible and non-sold-out products
  const query = { isVisible: true, isSoldOut: false };
  let message = PRODUCT_MESSAGES.PRODUCTS_FETCHED;

  // Handle search query
  if (search?.trim()) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
      { tags: { $regex: escapedSearch, $options: 'i' } },
    ];
    message += ` matching "${search}"`;
  }

  // Handle category filter
  if (category?.trim()) {
    if (mongoose.isValidObjectId(category)) {
      query.category = new mongoose.Types.ObjectId(category);
    } else {
      const categoryDoc = await Category.findOne({ slug: category, isActive: true }).lean();
      if (!categoryDoc) {
        return res.status(STATUS.BAD_REQUEST).json({
          statuscode: STATUS.BAD_REQUEST,
          message: 'Invalid category',
        });
      }
      query.category = categoryDoc._id;
    }
    message += ` in category "${category}"`;
  }

  // Handle price filter
  if (minPrice || maxPrice) {
    query.base_price = {};
    if (minPrice && !isNaN(parseFloat(minPrice))) {
      query.base_price.$gte = parseFloat(minPrice);
      message += ` with price >= ${minPrice}`;
    }
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      query.base_price.$lte = parseFloat(maxPrice);
      message += ` with price <= ${maxPrice}`;
    }
  }

  // Handle tags filter
  if (tags?.trim()) {
    const tagArray = Array.isArray(tags) 
      ? tags.map(tag => tag.trim().toLowerCase())
      : tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
    if (tagArray.length > 0) {
      query.tags = { $in: tagArray };
      message += ` with tags "${tags}"`;
    }
  }

  // Handle colors filter
  if (colors) {
    const colorIds = Array.isArray(colors) ? colors : [colors];
    if (colorIds.every(id => mongoose.isValidObjectId(id))) {
      query['variants.color'] = { $in: colorIds.map(id => new mongoose.Types.ObjectId(id)) };
      message += ` with colors "${colors}"`;
    } else {
      return res.status(STATUS.BAD_REQUEST).json({
        statuscode: STATUS.BAD_REQUEST,
        message: 'Invalid color ID(s)',
      });
    }
  }

  // Handle brands filter
  if (brands) {
    const brandIds = Array.isArray(brands) ? brands : [brands];
    if (brandIds.every(id => mongoose.isValidObjectId(id))) {
      query.brand = { $in: brandIds.map(id => new mongoose.Types.ObjectId(id)) };
      message += ` with brands "${brands}"`;
    } else {
      return res.status(STATUS.BAD_REQUEST).json({
        statuscode: STATUS.BAD_REQUEST,
        message: 'Invalid brand ID(s)',
      });
    }
  }

  // Handle collections filter
  if (collections) {
    const collectionArray = Array.isArray(collections) 
      ? collections 
      : collections.split(',').map(c => c.trim()).filter(c => c.length > 0);
    if (collectionArray.length > 0) {
      query.collections = { $in: collectionArray };
      message += ` with collections "${collections}"`;
    }
  }

  // Handle size filter
  if (size) {
    const sizeArray = Array.isArray(size) ? size : [size];
    if (sizeArray.length > 0) {
      query['variants.sizes.size'] = { $in: sizeArray };
      message += ` with sizes "${size}"`;
    }
  }

  // Define sorting
  const sort = {};
  const validSortFields = ['createdAt', 'base_price', 'rating', 'viewCount'];
  if (validSortFields.includes(sortBy)) {
    sort[sortBy] = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  try {
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('variants.color', 'name hex')
      .populate('brand', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(STATUS.OK).json({
      statuscode: STATUS.OK,
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
    console.error('Product fetch error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      statuscode: STATUS.SERVER_ERROR,
      message: `${PRODUCT_MESSAGES.SEARCH_FAILED}: ${error.message}`,
    });
  }
});

/**
 * @desc    Fetch new arrival products for customers
 * @route   GET /api/customer/v1/products/new-arrivals
 * @access  Public
 */
export const getNewArrivals = asyncHandler(async (req, res) => {
  const { limit = 8, tags = 'new', includeCategory = 'true' } = req.query;
  const parsedLimit = Math.min(parseInt(limit) || 8, 100);

  if (isNaN(parsedLimit) || parsedLimit < 1) {
    return res.status(STATUS.BAD_REQUEST).json({
      statuscode: STATUS.BAD_REQUEST,
      message: 'Invalid limit value',
    });
  }

  let tagArray = ['new'];
  if (tags) {
    tagArray = Array.isArray(tags)
      ? tags.map(tag => tag.trim().toLowerCase())
      : tags
          .split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.length > 0);

    // Generate variations of each tag
    tagArray = tagArray.reduce((acc, tag) => {
      const hyphenated = tag.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const spaced = tag.replace(/[^a-z0-9]+/g, ' ').trim();
      return [...acc, tag, hyphenated, spaced].filter(t => t.length > 0);
    }, []);
  }

  if (tagArray.length === 0) {
    return res.status(STATUS.BAD_REQUEST).json({
      statuscode: STATUS.BAD_REQUEST,
      message: 'No valid tags provided',
    });
  }

  try {
    let query = Product.find({
      isVisible: true,
      isSoldOut: false,
      tags: { $in: tagArray },
    })
      .select('name slug base_price images isFeatured createdAt tags description variants')
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    if (includeCategory === 'true') {
      query = query.populate('category', 'name slug');
    }

    const products = await query;

    if (!products || products.length === 0) {
      return res.status(STATUS.NOT_FOUND).json({
        statuscode: STATUS.NOT_FOUND,
        message: PRODUCT_MESSAGES.NO_PRODUCTS_FOUND,
      });
    }

    res.status(STATUS.OK).json({
      statuscode: STATUS.OK,
      message: PRODUCT_MESSAGES.PRODUCTS_FETCHED,
      data: products,
    });
  } catch (error) {
    console.error('New Arrivals Error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      statuscode: STATUS.SERVER_ERROR,
      message: `${PRODUCT_MESSAGES.SEARCH_FAILED}: ${error.message}`,
    });
  }
});

/**
 * @desc    Search products by text for customers
 * @route   GET /api/customer/v1/products/search
 * @access  Public
 */
export const searchCustomerProducts = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 12 } = req.query;

  if (!search?.trim()) {
    return res.status(STATUS.BAD_REQUEST).json({
      statuscode: STATUS.BAD_REQUEST,
      message: 'Search term is required',
    });
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  const query = { 
    isVisible: true,
    isSoldOut: false 
  };
  let message = PRODUCT_MESSAGES.PRODUCTS_FETCHED;

  if (search?.trim()) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
      { tags: { $regex: escapedSearch, $options: 'i' } },
    ];
    message += ` matching "${search}"`;
  }

  try {
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('variants.color', 'name hex')
      .populate('brand', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(STATUS.OK).json({
      statuscode: STATUS.OK,
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
      statuscode: STATUS.SERVER_ERROR,
      message: `${PRODUCT_MESSAGES.SEARCH_FAILED}: ${error.message}`,
    });
  }
});


/**
 * @desc    Filter products for customers with various criteria
 * @route   GET /api/customer/v1/products/filter
 * @access  Public
 */
export const filterCustomerProducts = asyncHandler(async (req, res) => {

  const {
    category,
    size,
    colors,
    brands,
    collections,
    tags,
    minPrice,
    maxPrice,
    available,
    soldOut,
    page = 1,
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Validate pagination
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  if (pageNum < 1 || limitNum < 1) {
    return res.status(STATUS.BAD_REQUEST).json({
      statuscode: STATUS.BAD_REQUEST,
      message: 'Invalid page or limit value',
    });
  }
  const skip = (pageNum - 1) * limitNum;

  // Initialize query for visible products
  const query = { isVisible: true };
  let message = PRODUCT_MESSAGES.PRODUCTS_FETCHED;

  // Helper function to parse filter arrays
  const parseFilterArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(v => v && v.trim().length > 0).map(v => v.trim());
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  };

  // Category filter
  let categoryId = null;
  if (category?.trim()) {
    if (mongoose.isValidObjectId(category)) {
      query.category = new mongoose.Types.ObjectId(category);
      categoryId = query.category;
    } else {
      const categoryDoc = await Category.findOne({ slug: category, isActive: true }).lean();
      if (!categoryDoc) {
        return res.status(STATUS.BAD_REQUEST).json({
          statuscode: STATUS.BAD_REQUEST,
          message: 'Invalid category',
        });
      }
      query.category = categoryDoc._id;
      categoryId = categoryDoc._id;
    }
    message += ` in category "${category}"`;
  }

  // Size filter
  if (size) {
    const sizeArray = parseFilterArray(size);
    if (sizeArray.length > 0) {
      query['variants.sizes.size'] = { $in: sizeArray };
      message += ` with sizes "${size}"`;
    }
  }

  // Colors filter
  if (colors) {
    const colorIds = parseFilterArray(colors);
    if (colorIds.length > 0 && colorIds.every(id => mongoose.isValidObjectId(id))) {
      query['variants.color'] = { $in: colorIds.map(id => new mongoose.Types.ObjectId(id)) };
      message += ` with colors "${colors}"`;
    } else {
      return res.status(STATUS.BAD_REQUEST).json({
        statuscode: STATUS.BAD_REQUEST,
        message: 'Invalid color ID(s)',
      });
    }
  }

  // Brands filter
  if (brands) {
    const brandIds = parseFilterArray(brands);
    if (brandIds.length > 0 && brandIds.every(id => mongoose.isValidObjectId(id))) {
      query.brand = { $in: brandIds.map(id => new mongoose.Types.ObjectId(id)) };
      message += ` with brands "${brands}"`;
    } else {
      return res.status(STATUS.BAD_REQUEST).json({
        statuscode: STATUS.BAD_REQUEST,
        message: 'Invalid brand ID(s)',
      });
    }
  }

  // Collections filter
  let collectionsArray = [];
  if (collections) {
    collectionsArray = parseFilterArray(collections);
    if (collectionsArray.length > 0) {
      query.collections = { $in: collectionsArray };
      message += ` with collections "${collections}"`;
    }
  }

  // Tags filter
  let tagsArray = [];
  if (tags) {
    tagsArray = parseFilterArray(tags);
    if (tagsArray.length > 0) {
      query.tags = { $in: tagsArray.map(tag => tag.toLowerCase()) };
      message += ` with tags "${tags}"`;
    }
  }

  // Price filter (applied to variants.price)
  let priceFilter = null;
  if (minPrice || maxPrice) {
    const min = minPrice && !isNaN(parseFloat(minPrice)) ? parseFloat(minPrice) : null;
    const max = maxPrice && !isNaN(parseFloat(maxPrice)) ? parseFloat(maxPrice) : null;

    if (min !== null && min < 0) {
      return res.status(STATUS.BAD_REQUEST).json({
        statuscode: STATUS.BAD_REQUEST,
        message: 'Minimum price cannot be negative',
      });
    }
    if (max !== null && max < 0) {
      return res.status(STATUS.BAD_REQUEST).json({
        statuscode: STATUS.BAD_REQUEST,
        message: 'Maximum price cannot be negative',
      });
    }
    if (min !== null && max !== null && min > max) {
      return res.status(STATUS.BAD_REQUEST).json({
        statuscode: STATUS.BAD_REQUEST,
        message: 'Minimum price cannot be greater than maximum price',
      });
    }

    priceFilter = { $exists: true, $ne: null };
    if (min !== null) {
      priceFilter.$gte = min;
      message += ` with price >= ${minPrice}`;
    }
    if (max !== null) {
      priceFilter.$lte = max;
      message += ` with price <= ${maxPrice}`;
    }
    query['variants.price'] = priceFilter;
  }

  // Availability filter
  if (available !== undefined) {
    const isAvailable = available === 'true' || available === true;
    query['variants.sizes.quantity'] = isAvailable ? { $gt: 0 } : { $lte: 0 };
    message += ` ${isAvailable ? 'available' : 'unavailable'} products`;
  }

  // Sold Out filter
  if (soldOut !== undefined) {
    query.isSoldOut = soldOut === 'true' || soldOut === true;
    message += ` ${soldOut ? 'sold out' : 'not sold out'} products`;
  }

  // Sorting
  const sort = {};
  const validSortFields = ['createdAt', 'base_price', 'rating', 'viewCount', 'name'];
  if (validSortFields.includes(sortBy)) {
    sort[sortBy] = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  try {
    // Log the primary query for debugging
    console.log('Primary Query:', JSON.stringify(query, null, 2));

    // Fetch total count for primary query
    const totalProducts = await Product.countDocuments(query);
    console.log('Total Products Matching Primary Query:', totalProducts);

    // Log sample products to verify price and tags
    const sampleProducts = await Product.find(query)
      .select('base_price variants.price tags')
      .limit(5)
      .lean();
    console.log('Sample Products:', JSON.stringify(sampleProducts, null, 2));

    // Fetch filtered products
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('variants.color', 'name hex')
      .populate('brand', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Fetch related products if any filter is applied
    let relatedProducts = [];
    if (categoryId || collectionsArray.length > 0 || tagsArray.length > 0) {
      const relatedQuery = {
        isVisible: true,
        _id: { $nin: products.map(p => p._id) },
        ...(priceFilter ? { 'variants.price': priceFilter } : {}), // Apply price filter to variants.price
        $or: [
          ...(categoryId ? [{ category: categoryId }] : []),
          ...(collectionsArray.length > 0 ? [{ collections: { $in: collectionsArray } }] : []),
          ...(tagsArray.length > 0 ? [{ tags: { $in: tagsArray.map(tag => tag.toLowerCase()) } }] : []),
        ],
      };

      // Log the related query for debugging
      console.log('Related Query:', JSON.stringify(relatedQuery, null, 2));

      relatedProducts = await Product.find(relatedQuery)
        .populate('category', 'name slug')
        .populate('variants.color', 'name hex')
        .populate('brand', 'name slug')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();

      // Log sample related products
      console.log('Sample Related Products:', JSON.stringify(relatedProducts.slice(0, 2).map(p => ({ _id: p._id, 'variants.price': p.variants.map(v => v.price), tags: p.tags })), null, 2));
    }

    // Prepare applied filters
    const appliedFilters = {
      category: category || null,
      size: size ? parseFilterArray(size) : null,
      colors: colors ? parseFilterArray(colors) : null,
      brands: brands ? parseFilterArray(brands) : null,
      collections: collections ? parseFilterArray(collections) : null,
      tags: tags ? parseFilterArray(tags) : null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      available: available || null,
      soldOut: soldOut || null,
    };

    res.status(STATUS.OK).json({
      statuscode: STATUS.OK,
      message,
      data: {
        products,
        relatedProducts,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalProducts / limitNum),
          totalItems: totalProducts,
          limit: limitNum,
        },
        appliedFilters,
      },
    });
  } catch (error) {
    console.error('Filter Error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      statuscode: STATUS.SERVER_ERROR,
      message: `${PRODUCT_MESSAGES.SEARCH_FAILED}: ${error.message}`,
    });
  }
});





export const getDealsOfTheMonth = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({
      isFeatured: true,
      isSoldOut: false,
      isVisible: true,
      isActive: true,
      discount: { $exists: true, $ne: null, $gt: 0 } // Ensure discount exists and is greater than 0
    })
      .select('name slug base_price discount images variants')
      // .populate('category', 'name slug')
      // .populate('variants.color', 'name hex')
      // .populate('brand', 'name slug')
      .sort({ discount: -1 }) // Sort by discount in descending order
      .limit(5) // Limit to top 5 products
      .lean();

    if (!products || products.length === 0) {
      return res.status(STATUS.NOT_FOUND).json({
        statuscode: STATUS.NOT_FOUND,
        message: PRODUCT_MESSAGES.NO_PRODUCTS_FOUND,
      });
    }

    // Transform the response to include only the first variant's image
    const transformedProducts = products.map(product => ({
      ...product,
      images: product.variants[0]?.images?.[0] || null, // Select first image of first variant
      variants: undefined // Remove variants to avoid sending unnecessary data
    }));

    res.status(STATUS.OK).json({
      statuscode: STATUS.OK,
      message: PRODUCT_MESSAGES.PRODUCTS_FETCHED + ' for Deals of the Month',
      data: transformedProducts,
    });
  } catch (error) {
    console.error('Deals of the Month Error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      statuscode: STATUS.SERVER_ERROR,
      message: `${PRODUCT_MESSAGES.SEARCH_FAILED}: ${error.message}`,
    });
  }
});
import Joi from 'joi';
import mongoose from 'mongoose';

/**
 * Sub-schema for size and stock details
 * @type {Joi.ObjectSchema}
 */
const sizeStockSchema = Joi.object({
  /**
   * Size label, required
   */
  size: Joi.string()
    .required()
    .messages({
      'string.empty': 'Size is required',
      'any.required': 'Size is required',
    }),
  /**
   * Stock quantity, required, non-negative integer
   */
  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Stock must be a number',
      'number.min': 'Stock cannot be negative',
      'number.integer': 'Stock must be an integer',
      'any.required': 'Stock is required',
    }),
});

/**
 * Sub-schema for product variants
 * @type {Joi.ObjectSchema}
 */
const variantSchema = Joi.object({
  /**
   * Color ID, required, valid MongoDB ObjectId
   */
  color: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid', { message: 'Invalid color ID' });
      }
      return value;
    })
    .optional()
    .messages({
      'any.required': 'Color ID is required',
      'any.invalid': 'Invalid color ID',
    }),
  /**
   * Variant price, required, non-negative, 2 decimal precision
   */
  price: Joi.number()
    .required()
    .min(0)
    .precision(2)
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required',
    }),
  /**
   * Array of images for the variant, defaults to empty array
   */
  images: Joi.array()
    .items(
      Joi.object({
        /**
         * Image URL, required, valid image extension
         */
        url: Joi.string()
          .required()
          .pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i)
          .messages({
            'string.pattern.base':
              'Image must be a valid image URL with a valid extension (jpg, jpeg, png, gif, webp, svg)',
            'any.required': 'Image URL is required',
          }),
        /**
         * Cloudinary public ID, required
         */
        public_id: Joi.string()
          .required()
          .messages({
            'string.empty': 'Cloudinary public ID is required',
            'any.required': 'Cloudinary public ID is required',
          }),
        /**
         * Alt text, optional, max 100 characters
         */
        alt: Joi.string()
          .max(100)
          .allow('')
          .default('')
          .messages({
            'string.max': 'Alt text cannot exceed 100 characters',
          }),
        /**
         * Indicates if image is primary, defaults to false
         */
        isPrimary: Joi.boolean()
          .default(false)
          .messages({
            'boolean.base': 'isPrimary must be a boolean',
          }),
      })
    )
    .default([]),
  /**
   * Array of size-stock details, defaults to empty array
   */
  sizes: Joi.array()
    .items(sizeStockSchema)
    .default([])
    .messages({
      'array.base': 'Sizes must be an array of size-stock objects',
    }),
});

/**
 * Joi schema for product validation
 * @type {Joi.ObjectSchema}
 */
const productSchema = Joi.object({
  /**
   * Product name, required, max 200 characters
   */
  name: Joi.string()
    .required()
    .max(200)
    .trim()
    .messages({
      'string.base': 'Product name must be a string',
      'string.empty': 'Product name is required',
      'any.required': 'Product name is required',
      'string.max': 'Product name cannot exceed 200 characters',
    }),
  /**
   * Category ID, required, valid MongoDB ObjectId
   */
  category: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid', { message: 'Invalid category ID' });
      }
      return value;
    })
    .required()
    .messages({
      'any.required': 'Category ID is required',
      'any.invalid': 'Invalid category ID',
    }),
  /**
   * Brand ID, required, valid MongoDB ObjectId
   */
  brand: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid', { message: 'Invalid brand ID' });
      }
      return value;
    })
    .required()
    .messages({
      'any.required': 'Brand ID is required',
      'any.invalid': 'Invalid brand ID',
    }),
  /**
   * Base price, required, non-negative, 2 decimal precision
   */
  base_price: Joi.number()
    .required()
    .min(0)
    .precision(2)
    .messages({
      'number.base': 'Base price must be a number',
      'number.min': 'Base price cannot be negative',
      'any.required': 'Base price is required',
    }),
  /**
   * Product description, optional, max 2000 characters
   */
  description: Joi.string()
    .max(2000)
    .trim()
    .allow('')
    .default('')
    .messages({
      'string.max': 'Description cannot exceed 2000 characters',
    }),
  /**
   * Array of variants, required
   */
  variants: Joi.array()
    .items(variantSchema)
    .required()
    .messages({
      'array.base': 'Variants must be an array of variant objects',
      'any.required': 'Variants are required',
    }),
  /**
   * Indicates if product is active, defaults to true
   */
  isActive: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean',
    }),
  /**
   * Product tags, optional
   */
  tags: Joi.string().optional(),
  /**
   * Product rating, optional, non-negative
   */
  // rating: Joi.number()
  //   .min(0)
  //   .default(0)
  //   .messages({
  //     'number.base': 'Rating must be a number',
  //     'number.min': 'Rating cannot be negative',
  //   }),
  /**
   * Video URL, optional, valid YouTube/Vimeo URL or null
   */
  videoUrl: Joi.string()
    .uri()
    .allow(null, '')
    .default(null)
    .pattern(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/).+$/)
    .messages({
      'string.uri': 'Video URL must be a valid URL',
      'string.pattern.base': 'Video URL must be from YouTube or Vimeo',
    }),
  /**
   * Indicates if product is featured, defaults to false
   */
  isFeatured: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'isFeatured must be a boolean',
    }),
  /**
   * Indicates if product is sold out, defaults to false
   */
  isSoldOut: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'isSoldOut must be a boolean',
    }),
  /**
   * Indicates if product is visible, defaults to true
   */
  isVisible: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isVisible must be a boolean',
    }),
  /**
   * SEO meta title, optional, max 60 characters
   */
  // metaTitle: Joi.string()
  //   .max(60)
  //   .trim()
  //   .allow('')
  //   .default('')
  //   .messages({
  //     'string.max': 'Meta title cannot exceed 60 characters',
  //   }),
  /**
   * SEO meta description, optional, max 160 characters
   */
  // metaDescription: Joi.string()
  //   .max(160)
  //   .trim()
  //   .allow('')
  //   .default('')
  //   .messages({
  //     'string.max': 'Meta description cannot exceed 160 characters',
  //   }),
  /**
   * Product specifications, optional
   */
  specifications: Joi.string().optional(),
  /**
   * Product collections, optional
   */
  collections: Joi.string().optional(),
  /**
   * Discount percentage, optional, 0-100, 2 decimal precision
   */
  discount: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative',
      'number.max': 'Discount cannot exceed 100%',
    }),
});





const searchQuerySchema = Joi.object({
  search: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Search term is required',
      'any.required': 'Search term is required',
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
    }),
});


export default productSchema;
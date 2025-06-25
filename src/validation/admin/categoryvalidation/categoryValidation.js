import Joi from 'joi';

const sizeSchema = Joi.object({
  label: Joi.string()
    .required()
    .messages({
      'string.empty': 'Size label is required',
      'any.required': 'Size label is required',
    }),
  symbol: Joi.string()
    .allow('')
    .default(''),
});

const categorySchema = Joi.object({
  name: Joi.string()
    .required()
    .max(100)
    .trim()
    .messages({
      'string.empty': 'Category name is required',
      'string.max': 'Category name cannot exceed 100 characters',
    }),
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .default('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  bannerImage: Joi.string()
    .optional()
    .allow(null, '')
    .messages({
      'string.uri': 'Banner image must be a valid URL',
    }),
  icon: Joi.string()
    .optional()
    .allow(null, '')
    .messages({
      'string.uri': 'Icon must be a valid URL',
    }),
  isActive: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean',
    }),
  sortOrder: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Sort order cannot be negative',
    }),
  productCount: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Product count cannot be negative',
    }),
  sizes: Joi.array()
    .items(sizeSchema)
    .default([])
    .messages({
      'array.base': 'Sizes must be an array of size objects',
    }),
});

export default categorySchema;
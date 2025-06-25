import Joi from 'joi';
import productSchema from '../../../validation/admin/producatvalidation/productValidation.js';
import categorySchema from '../../../validation/admin/categoryvalidation/categoryValidation.js';
import colorSchema from '../../../validation/admin/colorvalidation/colorvalidation.js';
import brandSchema from '../../../validation/admin/brandvalidation/brandvaalidation.js';

// Map of schemas by resource type
const schemaMap = {
  product: productSchema,
  category: categorySchema,
  color: colorSchema,
  brand: brandSchema
};

/**
 * Unified validation middleware
 * @param {string} resource - The resource type ('product', 'category', 'color', 'brand')
 */
export const validateResource = (resource) => {
  return (req, res, next) => {
    // Get the schema for the specified resource
    const schema = schemaMap[resource.toLowerCase()];

    if (!schema) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid resource type for validation',
        errors: ['Unknown resource type']
      });
    }

    // Validate the request body
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: 400,
        message: 'Validation error',
        errors: error.details.map((err) => err.message)
      });
    }

    next();
  };
};
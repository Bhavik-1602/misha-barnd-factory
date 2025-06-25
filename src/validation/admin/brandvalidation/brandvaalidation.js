import Joi from 'joi';

/**
 * Joi schema for brand validation
 * @type {Joi.ObjectSchema}
 */
const brandSchema = Joi.object({
  /**
   * Brand name, required, max 100 characters
   */
  name: Joi.string()
    .required()
    .trim()
    .max(100)
    .messages({
      'string.base': 'Brand name must be a string',
      'string.empty': 'Brand name is required',
      'any.required': 'Brand name is required',
      'string.max': 'Brand name cannot exceed 100 characters',
    }),
});

/**
 * Middleware to validate brand data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
export const validateBrand = (req, res, next) => {
  const { error } = brandSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 400,
      message: 'Validation error',
      errors: error.details.map(err => err.message),
    });
  }
  next();
};

export default brandSchema;
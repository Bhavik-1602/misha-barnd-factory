import Joi from 'joi';

/**
 * Joi schema for color validation
 * @type {Joi.ObjectSchema}
 */
export const colorSchema = Joi.object({
  /**
   * Color name, required, max 50 characters, lowercase
   */
  name: Joi.string()
    .required()
    .trim()
    .lowercase()
    .max(50)
    .messages({
      'string.base': 'Color name must be a string',
      'string.empty': 'Color name is required',
      'any.required': 'color name is required',
      'string.max': 'Color name cannot exceed 50 characters',
    }),
  /**
   * Hex code, required, valid 6-digit hexadecimal color code
   */
  hex: Joi.string()
    .required()
    .pattern(/^#[0-9A-F]{6}$/i)
    .messages({
      'string.base': 'Hex code must be a string',
      'string.empty': 'hex code is required',
      'string.required': 'Hex code is required',
      'string.pattern.base': 'Hex code must be a valid 6-digit hexadecimal color code (e.g., #FF000)',
    }),
});

/**
 * Middleware to validate color data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
export const validateColor = (req, res, next) => {
  const { error } = colorSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: 400,
      message: 'Validation error',
      errors: error.details.map(err => err.message),
    });
  }
  next();
};

export default colorSchema;
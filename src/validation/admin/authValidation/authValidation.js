import Joi from 'joi';

/**
 * Validation schema for admin registration
 * @type {Joi.ObjectSchema}
 */
export const registerValidation = Joi.object({
  /**
   * Admin name, required, 3-50 characters
   */
  name: Joi.string()
    .required()
    .min(3)
    .max(50)
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters long',
      'string.max': 'Name cannot exceed 50 characters',
    }),
  /**
   * Admin email, required, valid email format
   */
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
  /**
   * Admin password, required, min 6 characters, must include uppercase, lowercase, and number
   */
  password: Joi.string()
    .required()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  /**
   * Admin role, defaults to 'admin', must be 'admin' or 'superadmin'
   */
  role: Joi.string()
    .valid('admin', 'superadmin')
    .default('admin')
    .messages({
      'any.only': 'Role must be either admin or superadmin',
    }),

    mobileNumber: Joi.string()
    .optional()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Please enter a valid mobile number (e.g., +1234567890)',
    }),
});

/**
 * Validation schema for admin login
 * @type {Joi.ObjectSchema}
 */
export const loginValidation = Joi.object({
  /**
   * Admin email, required, valid email format
   */
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
  /**
   * Admin password, required
   */
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
    }),
});

/**
 * Validation schema for forgot password request
 * @type {Joi.ObjectSchema}
 */
export const forgotPasswordValidation = Joi.object({
  /**
   * Admin email, required, valid email format
   */
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
});

/**
 * Validation schema for resetting password
 * @type {Joi.ObjectSchema}
 */
export const resetPasswordValidation = Joi.object({
  /**
   * Reset token, required
   */
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Reset token is required',
    }),
  /**
   * New password, required, min 6 characters, must include uppercase, lowercase, and number
   */
  password: Joi.string()
    .required()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

/**
 * Validation schema for changing password
 * @type {Joi.ObjectSchema}
 */
export const changePasswordValidation = Joi.object({
  /**
   * Current password, required
   */
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
    }),
  /**
   * New password, required, different from current, min 6 characters, must include uppercase, lowercase, and number
   */
  newPassword: Joi.string()
    .required()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .disallow(Joi.ref('currentPassword'))
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 6 characters long',
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.invalid': 'New password must be different from current password',
    }),
});

/**
 * Validation schema for updating admin profile
 * @type {Joi.ObjectSchema}
 */
export const updateProfileValidation = Joi.object({
  /**
   * Admin name, optional, 2-50 characters
   */
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 50 characters',
    }),
  /**
   * Admin email, optional, valid email format
   */
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  /**
   * Profile image URL, optional, valid URL or null
   */
  image: Joi.string()
    .uri()
    .optional()
    .allow(null)
    .messages({
      'string.uri': 'Image must be a valid URL',
    }),

    mobileNumber: Joi.string()
    .optional()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow(null)
    .messages({
      'string.pattern.base': 'Please enter a valid mobile number (e.g., +1234567890)',
    }),
});
import jwt from 'jsonwebtoken';
import Admin from '../../../models/admin/admin.js';

/**
 * Middleware to authenticate admin users using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch admin from database, excluding password
    const admin = await Admin.findById(decoded.id).select('-password');

    // Check if admin exists
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
      });
    }

    // Check if admin account is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Attach admin to request object
    req.admin = admin;

    // Proceed to next middleware
    next();
  } catch (error) {
    // Log error for debugging
    console.error('Auth middleware error:', error);

    // Return unauthorized response
    res.status(401).json({
      success: false,
      message: 'Token is not valid',
    });
  }
};

export default auth;
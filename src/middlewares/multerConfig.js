import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import { v2 as cloudinary } from 'cloudinary';

import cloudinary from '../config/cloudinary.js'; // Adjust path as needed
// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration for categories
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'misha_brand/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [{ width: 960, height: 960, crop: 'limit' }],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `category_${uniqueSuffix}-${file.originalname.split('.')[0]}`;
    },
  },
});



// Cloudinary storage configuration for products
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'misha_brand/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [{ width: 960, height: 960, crop: 'limit' }],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `variant_${uniqueSuffix}-${file.originalname.split('.')[0]}`;
    },
  },
});


const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'misha_brand/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [{ width: 960, height: 960, crop: 'limit', quality: 'auto' }],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `profile_${uniqueSuffix}-${file.originalname.split('.')[0]}`;
    },
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  console.error('File rejected:', file.originalname, file.mimetype); // Debug line
  cb(new Error('Only images (jpg, jpeg, png, gif, webp, svg) are allowed'));
};

// Multer instances
const categoryUpload = multer({
  storage: categoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const productUpload = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});


const profileUpload = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helper function to create dynamic upload fields
const createUploadFields = (variantCount = 5, maxCount = 10) => {
  const fields = [];
  for (let i = 0; i < variantCount; i++) {
    fields.push({ name: `variantImage_${i}`, maxCount });
  }
  return fields;
};

// Factory function to create dynamic product image uploads
export const createProductImageUpload = (options = {}) => {
  const { 
    variantCount = 5, 
    maxCount = 10,
    fieldPrefix = 'variants'
  } = options;
  
  const fields = Array.from({ length: variantCount }, (_, i) => ({
    name: `${fieldPrefix}[${i}][image]`,
    maxCount
  }));
  
  return productUpload.fields(fields);
};

// Static middleware exports for categories
export const uploadCategoryImages = categoryUpload.fields([
  { name: 'bannerImage', maxCount: 1 },
  { name: 'icon', maxCount: 1 },
]);

// Dynamic product images with default configuration
export const uploadProductImages = createProductImageUpload({ 
  variantCount: 10, 
  maxCount: 10,
  fieldPrefix: 'variants'
});

// Alternative: Environment-based configuration
const VARIANT_COUNT = parseInt(process.env.MAX_VARIANTS) || 5;
export const uploadProductImagesEnv = createProductImageUpload({ 
  variantCount: VARIANT_COUNT, 
  maxCount: 10,
  fieldPrefix: 'variants'
});

// Middleware for single profile image upload
export const uploadProfileImage = categoryUpload.single('image');

// Additional helper functions for specific use cases
export const createUploadFromVariants = (variants, maxCount = 10) => {
  const fields = variants.map((variant, index) => ({
    name: `variants[${index}][image]`,
    maxCount,
  }));
  
  return productUpload.fields(fields);
};

// Middleware that dynamically creates fields based on request body
export const dynamicProductImageUpload = (req, res, next) => {
  const variantCount = req.query.variantCount || 
                      req.body.variantCount || 
                      req.params.variantCount || 
                      5;
  
  const uploadMiddleware = createProductImageUpload({ 
    variantCount: parseInt(variantCount),
    maxCount: 10,
    fieldPrefix: 'variants'
  });
  
  uploadMiddleware(req, res, next);
};

// For use in routes where you know the variant count ahead of time
export const createCustomProductUpload = (variantCount) => {
  return createProductImageUpload({ variantCount, maxCount: 10 });
};

// Export the base upload instances for custom configurations
export { categoryUpload as upload };
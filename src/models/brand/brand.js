import mongoose from 'mongoose';

/**
 * Mongoose schema for Brand model
 * @typedef {Object} BrandSchema
 */
const BrandSchema = new mongoose.Schema(
  {
    /**
     * Brand name (required and unique)
     */
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
      unique: true,
    },

    /**
     * URL-friendly slug generated from name
     */
    slug: {
      type: String,
      unique: true,
    },

    /**
     * Number of products associated with the brand
     */
    // product_count: {
    //   type: Number,
    //   default: 0,
    //   min: [0, 'Product count cannot be negative'],
    // },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

/**
 * Pre-save middleware to generate slug from name
 * @param {Function} next - Mongoose middleware next function
 */
BrandSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
  next();
});

/**
 * Indexes for improved query performance
 */
BrandSchema.index({ slug: 1 }, { unique: true }); // Ensure unique slugs
BrandSchema.index({ name: 'text' }); // Enable text search on name

/**
 * Mongoose model for Brand
 * @type {mongoose.Model}
 */
const Brand = mongoose.model('Brand', BrandSchema);

export default Brand;
import mongoose from 'mongoose';

/**
 * Mongoose schema for Color model
 * @typedef {Object} ColorSchema
 */
const ColorSchema = new mongoose.Schema(
  {
    /**
     * Color name (required, unique, and lowercase)
     */
    name: {
      type: String,
      required: [true, 'Color name is required'],
      trim: true,
      lowercase: true,
      maxlength: [50, 'Color name cannot exceed 50 characters'],
      unique: true,
    },

    /**
     * Hex code representing the color (e.g., #FF0000 for red)
     */
    hex: {
      type: String,
      required: [true, 'Hex code is required'],
      trim: true,
    },

    /**
     * URL-friendly slug generated from name
     */
    slug: {
      type: String,
      unique: true,
    },
    
      productCount: {
      type: Number,
      default: 0,
      min: [0, 'Product count cannot be negative'],
    },
    
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

/**
 * Pre-save middleware to generate slug from name
 * @param {Function} next - Mongoose middleware next function
 */
ColorSchema.pre('save', function (next) {
  // Generate slug if not provided and name exists
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
ColorSchema.index({ slug: 1 }, { unique: true }); // Ensure unique slugs
ColorSchema.index({ name: 'text' }); // Enable text search on name
ColorSchema.index({ 'product_counts_by_category.category': 1 }); // Optimize queries by category

/**
 * Mongoose model for Color
 * @type {mongoose.Model}
 */
const Color = mongoose.model('Color', ColorSchema);

export default Color;
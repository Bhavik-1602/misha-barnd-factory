import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    bannerImage: {
      type: String,
      default: null,
    },
    bannerImagePublicId: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    iconPublicId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sizes: [
      {
        label: {
          type: String,
          required: [true, 'Size label is required'],
        },
        symbol: {
          type: String,
        },
      },
    ],
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, 'Sort order cannot be negative'],
    },
    productCount: {
      type: Number,
      default: 0,
      min: [0, 'Product count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ name: 'text' });
CategorySchema.index({ isActive: 1 });

const Category = mongoose.model('Category', CategorySchema);

export default Category;
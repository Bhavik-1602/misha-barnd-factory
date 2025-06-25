import mongoose from 'mongoose';

/**
 * Schema for size and stock information
 * @typedef {Object} SizeStockSchema
 */
const SizeStockSchema = new mongoose.Schema(
  {
    /**
     * Size label (e.g., 'Small', 'M', '42')
     */
    size: {
      type: String,
      required: [true, 'Size label is required'],
    },
    /**
     * Available stock for the size
     */
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
    },
  },
  { _id: true }
);

/**
 * Schema for product variants
 * @typedef {Object} VariantSchema
 */
const VariantSchema = new mongoose.Schema(
  {
    /**
     * Reference to Color model
     */
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Color',
      required: [true, 'Color is required'],
    },
    /**
     * Price for the variant
     */
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    /**
     * Array of images for the variant
     */
    images: [
  {
    /**
     * URL to the image (Cloudinary URL)
     */
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v);
        },
        message: 'Image must be a valid HTTPS/HTTP URL with a valid extension (jpg, jpeg, png, gif, webp, svg)',
      },
    },
    /**
     * Cloudinary public ID for the image
     */
    public_id: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
    },
    /**
     * Alt text for the image
     */
    alt: {
      type: String,
      default: '',
      maxlength: [100, 'Alt text cannot exceed 100 characters'],
    },
    /**
     * Indicates if the image is the primary image for the variant
     */
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
],
    /**
     * Array of size and stock details
     */
    sizes: [SizeStockSchema],
  },
  { _id: true }
);

/**
 * Mongoose schema for Product model
 * @typedef {Object} ProductSchema
 */
const ProductSchema = new mongoose.Schema(
  {
    /**
     * Product name
     */
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    /**
     * URL-friendly slug generated from name
     */
    slug: {
      type: String,
      unique: true,
    },
    /**
     * Reference to Brand model
     */
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required'],
    },
    /**
     * Reference to Category model
     */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    /**
     * Base price of the product (rounded to 2 decimals)
     */
    base_price: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
      set: v => Math.round(v * 100) / 100,
    },
    /**
     * Product description
     */
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    /**
     * Array of product variants
     */
    variants: [VariantSchema],
    /**
     * Indicates if the product is active
     */
    isActive: {
      type: Boolean,
      default: true,
    },
    /**
     * Array of tags for the product
     */
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    /**
     * Product rating
     */
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
    },
    /**
     * URL for product video (YouTube or Vimeo)
     */
    videoUrl: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/).+$/.test(v);
        },
        message: 'Video URL must be from YouTube or Vimeo',
      },
    },
    /**
     * Indicates if the product is featured
     */
    isFeatured: {
      type: Boolean,
      default: false,
    },
    /**
     * Indicates if the product is sold out
     */
    isSoldOut: {
      type: Boolean,
      default: false,
    },
    /**
     * Indicates if the product is visible
     */
    isVisible: {
      type: Boolean,
      default: true,
    },
    /**
     * SEO meta title for the product
     */
    // metaTitle: {
    //   type: String,
    //   default: '',
    //   maxlength: [60, 'Meta title cannot exceed 60 characters'],
    // },
    /**
     * SEO meta description for the product
     */
    // metaDescription: {
    //   type: String,
    //   default: '',
    //   maxlength: [160, 'Meta description cannot exceed 160 characters'],
    // },
    /**
     * Number of times the product has been viewed
     */
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
    },
    /**
     * Number of WhatsApp inquiries for the product
     */
    whatsappInquiryCount: {
      type: Number,
      default: 0,
      min: [0, 'WhatsApp inquiry count cannot be negative'],
    },
    /**
     * Key-value pairs for product specifications
     */
    specifications: {
      type: Map,
      of: String,
      default: new Map(),
    },
    /**
     * Array of collection names the product belongs to
     */
    collections: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Collection name cannot exceed 100 characters'],
      },
    ],
    /**
     * Discount percentage for the product
     */
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
  },
  {
    timestamps: true // Adds createdAt and updatedAt fields
    // toJSON: { virtuals: true }, // Include virtuals in JSON output
    // toObject: { virtuals: true }, // Include virtuals in object output
  }
);

/**
 * Virtual field for category details
 */
ProductSchema.virtual('categoryDetails', {
  ref: 'Category',
  localField: 'category',
  foreignField: '_id',
  justOne: true,
});

/**
 * Virtual field for primary image
 */
ProductSchema.virtual('primaryImage').get(function () {
  for (const variant of this.variants) {
    const primary = variant.images.find(img => img.isPrimary);
    if (primary) return primary;
  }
  return this.variants[0]?.images[0] || null;
});

/**
 * Virtual field for WhatsApp message template
 */
ProductSchema.virtual('whatsappMessage').get(function () {
  const productUrl = `${process.env.FRONTEND_URL}/product/${this.slug}`;
  return `Hi, I'm interested in ${this.name}. ${productUrl}. Please share more details.`;
});

/**
 * Indexes for improved query performance
 */
ProductSchema.index({ slug: 1 }, { unique: true }); // Ensure unique slugs
ProductSchema.index({ category: 1 }); // Optimize category queries
ProductSchema.index({ brand: 1 }); // Optimize brand queries
ProductSchema.index({ isActive: 1 }); // Optimize active product queries
ProductSchema.index({ isFeatured: 1 }); // Optimize featured product queries
ProductSchema.index({ isSoldOut: 1 }); // Optimize sold out queries
ProductSchema.index({ createdAt: -1 }); // Optimize sorting by creation date
ProductSchema.index({ base_price: 1 }); // Optimize price queries
ProductSchema.index({ viewCount: -1 }); // Optimize view count sorting
ProductSchema.index({ whatsappInquiryCount: -1 }); // Optimize WhatsApp inquiry sorting
ProductSchema.index({ collections: 1 }); // Optimize collection queries
ProductSchema.index({ 'variants.color': 1 }); // Optimize color queries
ProductSchema.index({ tags: 1 }); // Optimize tag queries
ProductSchema.index({ rating: -1 }); // Optimize rating sorting

/**
 * Compound indexes for common query patterns
 */
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, base_price: 1 });

/**
 * Text search index for name
 */
ProductSchema.index({ name: 'text' });

/**
 * Pre-save middleware to set slug, meta fields, and ensure single primary image
 * @param {Function} next - Mongoose middleware next function
 */
ProductSchema.pre('save', async function (next) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Set default metaTitle from name
  // if (!this.metaTitle && this.name) {
  //   this.metaTitle = this.name;
  // }

  // Set default metaDescription from description
  // if (!this.metaDescription && this.description) {
  //   this.metaDescription = this.description.substring(0, 160);
  // }

  // Ensure only one primary image per variant
  if (this.variants?.length > 0) {
    this.variants.forEach(variant => {
      let primaryCount = 0;
      variant.images.forEach((img, index) => {
        if (img.isPrimary) {
          primaryCount++;
          if (primaryCount > 1) {
            img.isPrimary = false;
          }
        }
      });
      if (primaryCount === 0 && variant.images.length > 0) {
        variant.images[0].isPrimary = true;
      }
    });
  }

  next();
});

/**
 * Post-save middleware to update Brand and Color counts
 * @param {Object} doc - Saved product document
 */
ProductSchema.post('save', async function (doc) {
  const Color = mongoose.model('Color');
  const Brand = mongoose.model('Brand');

  // Calculate total stock
  const totalStock = doc.variants.reduce(
    (sum, variant) => sum + variant.sizes.reduce((s, size) => s + size.stock, 0),
    0
  );

  // Update brand product_count
  if (doc.brand) {
    await Brand.findByIdAndUpdate(doc.brand, {
      $inc: { product_count: totalStock },
    });
  }

  // Update color product_counts_by_category
  if (doc.variants?.length > 0) {
    const colorUpdates = doc.variants.map(variant => ({
      updateOne: {
        filter: { _id: variant.color, 'product_counts_by_category.category': doc.category },
        update: {
          $inc: {
            'product_counts_by_category.$.count': variant.sizes.reduce((s, size) => s + size.stock, 0),
          },
        },
      },
    }));
    await Color.bulkWrite(colorUpdates);
  }
});

/**
 * Post-remove middleware to update Brand and Color counts
 * @param {Object} doc - Removed product document
 */
ProductSchema.post('remove', async function (doc) {
  const Color = mongoose.model('Color');
  const Brand = mongoose.model('Brand');

  // Calculate total stock
  const totalStock = doc.variants.reduce(
    (sum, variant) => sum + variant.sizes.reduce((s, size) => s + size.stock, 0),
    0
  );

  // Decrease brand product_count
  if (doc.brand) {
    await Brand.findByIdAndUpdate(doc.brand, {
      $inc: { product_count: -totalStock },
    });
  }

  // Decrease color product_counts_by_category
  if (doc.variants?.length > 0) {
    const colorUpdates = doc.variants.map(variant => ({
      updateOne: {
        filter: { _id: variant.color, 'product_counts_by_category.category': doc.category },
        update: {
          $inc: {
            'product_counts_by_category.$.count': -variant.sizes.reduce((s, size) => s + size.stock, 0),
          },
        },
      },
    }));
    await Color.bulkWrite(colorUpdates);
  }
});




/**
 * Mongoose model for Product
 * @type {mongoose.Model}
 */
const Product = mongoose.model('Product', ProductSchema);

export default Product;
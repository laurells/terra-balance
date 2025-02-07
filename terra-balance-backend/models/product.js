const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

Mongoose.plugin(slug, options);

// Product Schema
const ProductSchema = new Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  detail: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  imageUrl: {
    type: String
  },
  imageUrl2: {
    type: String
  },
  imageKey: {
    type: String
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  categoryName: {
    type: String,
    trim: true
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  quantity: {
    type: Number,
    default: 0
  },
  taxable: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updated: {
    type: Date,
    default: Date.now
  },
  created: {
    type: Date,
    default: Date.now
  }
}, {
  // Add virtuals for additional computed properties
  virtuals: {
    img1: {
      get() {
        return this.imageUrl;
      }
    },
    img2: {
      get() {
        return this.imageUrl2;
      }
    }
  },

  // Ensure virtuals are included when converting to JSON
  toJSON: {
    virtuals: true,
    getters: true
  },

  // Ensure virtuals are included when converting to Object
  toObject: {
    virtuals: true,
    getters: true
  }
});

// Pre-save hook to set category name
ProductSchema.pre('save', function(next) {
  if (this.category && !this.categoryName) {
    this.categoryName = this.category.name;
  }
  next();
});

// Method to calculate final price after discount
ProductSchema.methods.getFinalPrice = function() {
  return this.price * (1 - this.discountPercent / 100);
};

// Validation for unique SKU
ProductSchema.path('sku').validate(async function(value) {
  const count = await this.model('Product').countDocuments({ sku: value, _id: { $ne: this._id } });
  return !count;
}, 'SKU must be unique');

module.exports = Mongoose.model('Product', ProductSchema);

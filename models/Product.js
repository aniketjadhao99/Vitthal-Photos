const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    default: 'No description provided.'
  },
  basePrice: {
    type: Number,
    required: true,
    default: 0
  },

  sku: {
    type: String,
    unique: true,
    sparse: true
  },

  images: [String],

  maskImage: { type: String },

  category: {
    type: String,
    required: true
  },

  variants: {
    sizes: [
      {
        size: { type: String },
        priceModifier: { type: Number, default: 0 }
      }
    ],
    colors: [
      { name: String, hexCode: String }
    ]
  },

  stock: {
    type: Number,
    required: true,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field so frontend can use product.price
productSchema.virtual('price').get(function () {
  return this.basePrice;
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },

  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
      },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      price: { type: Number, required: true },


      customization: {
        hasCustomization: { type: Boolean, default: false },
        userUploadedImage: { type: String },
        selectedSize: { type: String },
        selectedColor: { type: String },
        selectedFrame: { type: String },
        orientation: { type: String },


        cropData: {
          x: Number,
          y: Number,
          scale: Number,
          rotation: Number
        }
      }
    }
  ],

  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },

  paymentMethod: { type: String, required: true },

  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },

  totalPrice: { type: Number, required: true, default: 0.0 },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: Date,
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: Date,
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  status: { type: String, required: true, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }

}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
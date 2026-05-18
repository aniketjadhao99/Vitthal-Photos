const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MONGO_URI or DATABASE_URL not set in .env');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

// Import existing models
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Settings = require('../models/Settings');

// Create additional models for new features if they don't exist
let Address, Coupon, ReturnRequest, ContactForm, UserWishlist;

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
addressSchema.index({ userId: 1 });
Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: String,
  discountType: { type: String, default: 'percentage' },
  discountValue: { type: Number, required: true },
  maxDiscount: Number,
  minOrderValue: Number,
  maxUses: Number,
  currentUses: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startsAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
couponSchema.index({ isActive: 1 });
Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

const returnRequestSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  description: String,
  status: { type: String, default: 'pending' },
  refundAmount: Number,
  refundStatus: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
returnRequestSchema.index({ orderId: 1 });
returnRequestSchema.index({ status: 1 });
ReturnRequest = mongoose.models.ReturnRequest || mongoose.model('ReturnRequest', returnRequestSchema);

const contactFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'new' },
  response: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
contactFormSchema.index({ status: 1 });
ContactForm = mongoose.models.ContactForm || mongoose.model('ContactForm', contactFormSchema);

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
});
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
UserWishlist = mongoose.models.UserWishlist || mongoose.model('UserWishlist', wishlistSchema);

const translatePrismaWhere = (where, isOrderModel = false) => {
  if (!where) return {};
  const newWhere = {};
  for (const key of Object.keys(where)) {
    if (key === 'OR') {
      newWhere.$or = where.OR.map(w => translatePrismaWhere(w, isOrderModel));
    } else if (key === 'AND') {
      newWhere.$and = where.AND.map(w => translatePrismaWhere(w, isOrderModel));
    } else if (key === 'NOT') {
      newWhere.$not = where.NOT.map(w => translatePrismaWhere(w, isOrderModel));
    } else if (isOrderModel && key === 'userId') {
      newWhere.user = where[key];
    } else if (where[key] && typeof where[key] === 'object' && !Array.isArray(where[key]) && !(where[key] instanceof Date)) {
      if (where[key].in) {
        newWhere[key] = { $in: where[key].in };
      } else {
        newWhere[key] = where[key];
      }
    } else {
      newWhere[key] = where[key];
    }
  }
  return newWhere;
};

// Create Prisma-like wrapper for compatibility
const prismaAdapter = {
  user: {
    findMany: async (opts = {}) => {
      let query = User.find(translatePrismaWhere(opts.where) || {});
      if (opts.orderBy) Object.keys(opts.orderBy).forEach(key => query.sort({ [key]: opts.orderBy[key] === 'desc' ? -1 : 1 }));
      if (opts.take) query.limit(opts.take);
      if (opts.skip) query.skip(opts.skip);
      return query;
    },
    findUnique: async (opts) => opts.where?.id ? User.findById(opts.where.id) : User.findOne(translatePrismaWhere(opts.where)),
    create: async (opts) => User.create(opts.data),
    update: async (opts) => User.findByIdAndUpdate(opts.where.id, opts.data, { new: true }),
    count: async (opts = {}) => User.countDocuments(translatePrismaWhere(opts.where) || {}),
    delete: async (opts) => User.findByIdAndDelete(opts.where.id),
  },
  product: {
    findMany: async (opts = {}) => {
      let query = Product.find(translatePrismaWhere(opts.where) || {});
      if (opts.orderBy) Object.keys(opts.orderBy).forEach(key => query.sort({ [key]: opts.orderBy[key] === 'desc' ? -1 : 1 }));
      if (opts.take) query.limit(opts.take);
      if (opts.skip) query.skip(opts.skip);
      return query;
    },
    findUnique: async (opts) => opts.where?.id ? Product.findById(opts.where.id) : Product.findOne(translatePrismaWhere(opts.where)),
    create: async (opts) => Product.create(opts.data),
    update: async (opts) => Product.findByIdAndUpdate(opts.where.id, opts.data, { new: true }),
    count: async (opts = {}) => Product.countDocuments(translatePrismaWhere(opts.where) || {}),
    aggregate: async (opts) => Product.aggregate([{ $group: { _id: null, ...opts._sum || {} } }]),
    groupBy: async (opts) => {
      const field = opts.by[0];
      return Product.aggregate([{ $group: { _id: `$${field}`, _count: { $sum: 1 } } }]);
    },
  },
  order: {
    findMany: async (opts = {}) => {
      let query = Order.find(translatePrismaWhere(opts.where, true) || {});
      if (opts.orderBy) Object.keys(opts.orderBy).forEach(key => query.sort({ [key]: opts.orderBy[key] === 'desc' ? -1 : 1 }));
      if (opts.take) query.limit(opts.take);
      if (opts.skip) query.skip(opts.skip);
      const orders = await query.lean();
      return orders.map(order => ({
        ...order,
        id: order._id.toString(),
        userId: order.user ? order.user.toString() : null
      }));
    },
    findUnique: async (opts) => {
      const where = translatePrismaWhere(opts.where, true);
      const order = await (opts.where?.id ? Order.findById(opts.where.id).lean() : Order.findOne(where).lean());
      if (!order) return null;
      return {
        ...order,
        id: order._id.toString(),
        userId: order.user ? order.user.toString() : null
      };
    },
    create: async (opts) => Order.create(opts.data),
    update: async (opts) => {
      const order = await Order.findByIdAndUpdate(opts.where.id, opts.data, { new: true }).lean();
      if (!order) return null;
      return {
        ...order,
        id: order._id.toString(),
        userId: order.user ? order.user.toString() : null
      };
    },
    count: async (opts = {}) => Order.countDocuments(translatePrismaWhere(opts.where, true) || {}),
    aggregate: async (opts) => Order.aggregate([{ $group: { _id: null, ...opts._sum || {} } }]),
    groupBy: async (opts) => {
      const field = opts.by[0];
      return Order.aggregate([{ $group: { _id: `$${field}`, _count: { $sum: 1 } } }]);
    },
  },
  coupon: {
    findMany: async (opts = {}) => {
      let query = Coupon.find(translatePrismaWhere(opts.where) || {});
      if (opts.orderBy) Object.keys(opts.orderBy).forEach(key => query.sort({ [key]: opts.orderBy[key] === 'desc' ? -1 : 1 }));
      if (opts.take) query.limit(opts.take);
      return query;
    },
    findUnique: async (opts) => opts.where?.code ? Coupon.findOne({ code: opts.where.code }) : Coupon.findById(opts.where.id),
    create: async (opts) => Coupon.create(opts.data),
    update: async (opts) => Coupon.findByIdAndUpdate(opts.where.id, opts.data, { new: true }),
    delete: async (opts) => Coupon.findByIdAndDelete(opts.where.id),
  },
  address: {
    findMany: async (opts = {}) => Address.find(translatePrismaWhere(opts.where) || {}),
    findUnique: async (opts) => Address.findById(opts.where.id),
    create: async (opts) => Address.create(opts.data),
    update: async (opts) => Address.findByIdAndUpdate(opts.where.id, opts.data, { new: true }),
    updateMany: async (opts) => Address.updateMany(translatePrismaWhere(opts.where), opts.data),
    delete: async (opts) => Address.findByIdAndDelete(opts.where.id),
  },
  returnRequest: {
    findMany: async (opts = {}) => ReturnRequest.find(translatePrismaWhere(opts.where) || {}),
    findUnique: async (opts) => ReturnRequest.findById(opts.where.id),
    findFirst: async (opts) => ReturnRequest.findOne(translatePrismaWhere(opts.where) || {}),
    create: async (opts) => ReturnRequest.create(opts.data),
    update: async (opts) => ReturnRequest.findByIdAndUpdate(opts.where.id, opts.data, { new: true }),
    delete: async (opts) => ReturnRequest.findByIdAndDelete(opts.where.id),
  },
  contactForm: {
    findMany: async (opts = {}) => ContactForm.find(translatePrismaWhere(opts.where) || {}),
    findUnique: async (opts) => ContactForm.findById(opts.where.id),
    create: async (opts) => ContactForm.create(opts.data),
    update: async (opts) => ContactForm.findByIdAndUpdate(opts.where.id, opts.data, { new: true }),
  },
  review: {
    findMany: async (opts = {}) => Review.find(translatePrismaWhere(opts.where) || {}),
    findUnique: async (opts) => Review.findById(opts.where.id),
    create: async (opts) => Review.create(opts.data),
    update: async (opts) => Review.findByIdAndUpdate(opts.where.id, opts.data, { new: true }),
  },
  userWishlist: {
    findMany: async (opts = {}) => UserWishlist.find(translatePrismaWhere(opts.where) || {}),
    findUnique: async (opts) => UserWishlist.findById(opts.where.id),
    create: async (opts) => UserWishlist.create(opts.data),
    delete: async (opts) => UserWishlist.findByIdAndDelete(opts.where.id),
  },
};

module.exports = {
  connectDB,
  User,
  Product,
  Order,
  Review,
  Settings,
  Address,
  Coupon,
  ReturnRequest,
  ContactForm,
  UserWishlist,
  ...prismaAdapter,
};

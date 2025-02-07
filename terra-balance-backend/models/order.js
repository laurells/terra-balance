const Mongoose = require('mongoose');
const { Schema } = Mongoose;
const { ROLES } = require('../constants');

// Order Status Enum
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Payment Method Enum
const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CASH_ON_DELIVERY: 'cash_on_delivery'
};

// Order Schema
const OrderSchema = new Schema({
  // Basic Order Information
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },

  // Order Details
  products: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    discountPercent: {
      type: Number,
      default: 0
    }
  }],

  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },

  // Shipping Information
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  // Order Status and Tracking
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },

  // Tracking Information
  trackingNumber: {
    type: String
  },
  trackingCarrier: {
    type: String
  },

  // Timestamps
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  },
  
  // Audit Trail
  history: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }]
}, {
  // Add methods to the schema
  methods: {
    // Method to calculate total with tax and shipping
    calculateTotal() {
      this.total = this.subtotal + this.tax + this.shipping;
      return this.total;
    },

    // Method to update order status with history tracking
    updateStatus(newStatus, user, notes = '') {
      this.history.push({
        status: newStatus,
        updatedBy: user,
        notes
      });
      this.status = newStatus;
      this.updated = new Date();
    }
  },

  // Ensure virtuals are included when converting to JSON
  toJSON: {
    virtuals: true,
    getters: true
  }
});

// Pre-save hook to generate unique order number
OrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    // Generate a unique order number (e.g., ORD-YYYYMMDD-XXXXX)
    const date = new Date();
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = `ORD-${formattedDate}-${randomPart}`;
  }
  next();
});

// Static method to find orders by status
OrderSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

module.exports = {
  Order: Mongoose.model('Order', OrderSchema),
  ORDER_STATUS,
  PAYMENT_METHODS
};

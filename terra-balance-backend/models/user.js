const Mongoose = require('mongoose');

const { ROLES, EMAIL_PROVIDER } = require('../constants');

const { Schema } = Mongoose;

// User Schema
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  // firstName: {
  //   type: String,
  //   trim: true
  // },
  // lastName: {
  //   type: String,
  //   trim: true
  // },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  shippingAddress: {
    type: String,
    trim: true,
    default: ''
  },
  merchant: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null
  },
  provider: {
    type: String,
    required: true,
    default: EMAIL_PROVIDER.Email
  },
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    default: ROLES.Member,
    enum: [ROLES.Admin, ROLES.Member, ROLES.Merchant]
  },
  resetPasswordToken: { 
    type: String 
  },
  resetPasswordExpires: { 
    type: Date 
  },
  isSubscribed: {
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
  // Add methods to the schema
  methods: {
    // Method to get full name
    getFullName() {
      return this.fullname || `${this.firstName} ${this.lastName}`.trim();
    },

    // Method to check if user is admin
    isAdmin() {
      return this.role === ROLES.Admin;
    }
  },

  // Add virtuals for additional computed properties
  virtuals: {
    displayName: {
      get() {
        return this.fullname || `${this.firstName} ${this.lastName}`.trim();
      }
    }
  },

  // Ensure virtuals are included when converting to JSON
  toJSON: {
    virtuals: true
  }
});

// Pre-save hook to set firstName and lastName from fullname if not provided
UserSchema.pre('save', function(next) {
  if (this.fullname && (!this.firstName || !this.lastName)) {
    const nameParts = this.fullname.split(' ');
    this.firstName = nameParts[0];
    this.lastName = nameParts.slice(1).join(' ');
  }
  next();
});

// Validation for unique email
UserSchema.path('email').validate(async function(value) {
  const count = await this.model('User').countDocuments({ email: value, _id: { $ne: this._id } });
  return !count;
}, 'Email already exists');

module.exports = Mongoose.model('User', UserSchema);

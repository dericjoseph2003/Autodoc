const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  user_full_name: {
    type: String,
    required: [true, 'User full name is required'],
    trim: true
  },
  user_email: {
    type: String,
    required: [true, 'User email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  googleId: {
    type: String,
    default: null
  },
  user_password_hash: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    minlength: [8, 'Password must be at least 8 characters long']
  },
  user_phone_number: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    trim: true
  },
  user_role: {
    type: String,
    enum: {
      values: ['owner', 'service_center', 'admin'],
      message: 'Role must be owner, service_center, or admin'
    },
    default: 'owner'
  },
  user_profile_image_path: {
    type: String,
    default: null
  },
  user_is_verified: {
    type: Boolean,
    default: false
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  alternateContactNumber: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: { type: String, trim: true },
    number: { type: String, trim: true }
  },
  preferredLanguage: {
    type: String,
    default: 'English',
    trim: true
  },
  notificationPreferences: {
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true }
  },
  failedLoginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  resetPasswordOtp: {
    type: String,
    default: null
  },
  resetPasswordOtpExpire: {
    type: Date,
    default: null
  }
}, {
  collection: 'tbl_users',
  timestamps: {
    createdAt: 'user_created_at',
    updatedAt: 'user_updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual primary key alias
userSchema.virtual('user_id').get(function() { return this._id; });

// Compatibility virtual getters/setters
userSchema.virtual('name').get(function() { return this.user_full_name; }).set(function(v) { this.user_full_name = v; });
userSchema.virtual('email').get(function() { return this.user_email; }).set(function(v) { this.user_email = v; });
userSchema.virtual('phone').get(function() { return this.user_phone_number; }).set(function(v) { this.user_phone_number = v; });
userSchema.virtual('password').get(function() { return this.user_password_hash; }).set(function(v) { this.user_password_hash = v; });
userSchema.virtual('role').get(function() { return this.user_role; }).set(function(v) { this.user_role = v; });
userSchema.virtual('profilePhoto').get(function() { return this.user_profile_image_path; }).set(function(v) { this.user_profile_image_path = v; });

userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.user_password_hash;
  delete obj.password;
  obj.id = obj._id;
  obj.user_id = obj._id;
  obj.name = obj.user_full_name || obj.name;
  obj.email = obj.user_email || obj.email;
  obj.phone = obj.user_phone_number || obj.phone;
  obj.role = obj.user_role || obj.role;
  obj.profilePhoto = obj.user_profile_image_path || obj.profilePhoto;
  return obj;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('user_password_hash')) {
    if (next && typeof next === 'function') return next();
    return;
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.user_password_hash = await bcrypt.hash(this.user_password_hash, salt);
    if (next && typeof next === 'function') next();
  } catch (error) {
    if (next && typeof next === 'function') return next(error);
    throw error;
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.user_password_hash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;

const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Service center must be linked to a user (user_id)']
  },
  service_center_name: {
    type: String,
    required: [true, 'Service center name is required'],
    trim: true
  },
  service_center_address: {
    type: String,
    required: [true, 'Service center address is required'],
    trim: true
  },
  service_center_latitude: {
    type: Number,
    default: 0
  },
  service_center_longitude: {
    type: Number,
    default: 0
  },
  service_center_phone_number: {
    type: String,
    trim: true,
    default: ''
  },
  service_center_rating: {
    type: Number,
    default: 0
  },
  service_center_is_verified: {
    type: Boolean,
    default: false
  },
  city: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  businessRegistrationNumber: {
    type: String,
    default: '',
    trim: true
  },
  contactPersonName: {
    type: String,
    trim: true,
    default: ''
  },
  servicesOffered: {
    type: [String],
    default: []
  },
  businessDocumentUrl: {
    type: String,
    trim: true
  },
  approvalStatus: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Approval status must be pending, approved, or rejected'
    },
    default: 'pending'
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'deactivated'],
      message: 'Status must be pending, approved, or deactivated'
    },
    default: 'pending'
  },
  operatingHours: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  shopImages: {
    type: [String],
    default: []
  }
}, {
  collection: 'tbl_service_centers',
  timestamps: {
    createdAt: 'service_center_created_at',
    updatedAt: 'service_center_updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

serviceCenterSchema.virtual('service_center_id').get(function() { return this._id; });

serviceCenterSchema.virtual('manager').get(function() { return this.user_id; }).set(function(v) { this.user_id = v; });
serviceCenterSchema.virtual('user').get(function() { return this.user_id; }).set(function(v) { this.user_id = v; });
serviceCenterSchema.virtual('businessName').get(function() { return this.service_center_name; }).set(function(v) { this.service_center_name = v; });
serviceCenterSchema.virtual('businessAddress').get(function() { return this.service_center_address; }).set(function(v) { this.service_center_address = v; });
serviceCenterSchema.virtual('latitude').get(function() { return this.service_center_latitude; }).set(function(v) { this.service_center_latitude = v; });
serviceCenterSchema.virtual('longitude').get(function() { return this.service_center_longitude; }).set(function(v) { this.service_center_longitude = v; });
serviceCenterSchema.virtual('phone').get(function() { return this.service_center_phone_number; }).set(function(v) { this.service_center_phone_number = v; });
serviceCenterSchema.virtual('rating').get(function() { return this.service_center_rating; }).set(function(v) { this.service_center_rating = v; });
serviceCenterSchema.virtual('isVerified').get(function() { return this.service_center_is_verified; }).set(function(v) { this.service_center_is_verified = v; });

serviceCenterSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id;
  obj.service_center_id = obj._id;
  obj.manager = obj.user_id;
  obj.user = obj.user_id;
  obj.businessName = obj.service_center_name || obj.businessName;
  obj.businessAddress = obj.service_center_address || obj.businessAddress;
  obj.latitude = obj.service_center_latitude || obj.latitude;
  obj.longitude = obj.service_center_longitude || obj.longitude;
  obj.phone = obj.service_center_phone_number || obj.phone;
  obj.rating = obj.service_center_rating || obj.rating;
  obj.isVerified = obj.service_center_is_verified || obj.isVerified;
  return obj;
};

const ServiceCenter = mongoose.model('ServiceCenter', serviceCenterSchema);
module.exports = ServiceCenter;

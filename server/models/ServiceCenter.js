const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema(
  {
    serviceCenterId: {
      type: String,
      required: [true, 'serviceCenterId is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Service center name is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'Multi-brand Service Center',
      trim: true,
    },
    location: {
      address: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected', 'pending', 'approved', 'rejected'],
        message: 'Status must be Pending, Approved, or Rejected',
      },
      default: 'Pending',
    },
    contact: {
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    // Legacy fields for backwards compatibility with earlier controllers/routes
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    service_center_name: { type: String, trim: true },
    service_center_address: { type: String, trim: true },
    service_center_latitude: { type: Number, default: 0 },
    service_center_longitude: { type: Number, default: 0 },
    service_center_phone_number: { type: String, trim: true, default: '' },
    service_center_rating: { type: Number, default: 0 },
    service_center_is_verified: { type: Boolean, default: false },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    businessRegistrationNumber: { type: String, default: '', trim: true },
    contactPersonName: { type: String, trim: true, default: '' },
    servicesOffered: { type: [mongoose.Schema.Types.Mixed], default: [] },
    businessDocumentUrl: { type: String, trim: true },
    approvalStatus: { type: String, default: 'pending' },
    operatingHours: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    shopImages: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook for full backward compatibility
serviceCenterSchema.pre('validate', function () {
  if (!this.name && this.service_center_name) {
    this.name = this.service_center_name;
  } else if (!this.service_center_name && this.name) {
    this.service_center_name = this.name;
  }
  if (!this.serviceCenterId) {
    this.serviceCenterId = this._id ? this._id.toString() : `sc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
});

// Virtual compatibility getters/setters
serviceCenterSchema.virtual('service_center_id').get(function () {
  return this.serviceCenterId || this._id;
});

serviceCenterSchema.virtual('businessName').get(function () {
  return this.name || this.service_center_name;
});

const ServiceCenter = mongoose.model('ServiceCenter', serviceCenterSchema);
module.exports = ServiceCenter;

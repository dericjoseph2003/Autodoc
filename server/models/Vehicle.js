const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vehicle must be linked to a user (user_id)']
  },
  vehicle_make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  vehicle_model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  vehicle_year: {
    type: Number,
    required: [true, 'Vehicle model year is required']
  },
  vehicle_type: {
    type: String,
    enum: {
      values: ['car', 'bike', 'suv', 'truck', 'other'],
      message: 'Vehicle type must be car, bike, suv, truck, or other'
    },
    required: [true, 'Vehicle type is required']
  },
  vehicle_registration_number: {
    type: String,
    required: [true, 'Vehicle registration number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^(?:[A-Z]{2}[\s-]?[0-9]{1,2}(?:[\s-]?[A-Z]{1,3})?[\s-]?[0-9]{4}|[0-9]{2}[\s-]?BH[\s-]?[0-9]{4}[\s-]?[A-Z]{1,2})$/i, 'Please enter a valid Indian vehicle registration number (e.g., MH 12 AB 1234 or 22 BH 1234 AB)']
  },
  vehicle_color: {
    type: String,
    trim: true
  },
  fuelType: {
    type: String,
    enum: {
      values: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'other'],
      message: 'Fuel type must be petrol, diesel, electric, hybrid, cng, or other'
    },
    default: 'petrol'
  },
  chassisNumber: {
    type: String,
    trim: true
  }
}, {
  collection: 'tbl_vehicles',
  timestamps: {
    createdAt: 'vehicle_created_at',
    updatedAt: 'vehicle_updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

vehicleSchema.virtual('vehicle_id').get(function() { return this._id; });

vehicleSchema.virtual('owner').get(function() { return this.user_id; }).set(function(v) { this.user_id = v; });
vehicleSchema.virtual('make').get(function() { return this.vehicle_make; }).set(function(v) { this.vehicle_make = v; });
vehicleSchema.virtual('model').get(function() { return this.vehicle_model; }).set(function(v) { this.vehicle_model = v; });
vehicleSchema.virtual('year').get(function() { return this.vehicle_year; }).set(function(v) { this.vehicle_year = v; });
vehicleSchema.virtual('vehicleType').get(function() { return this.vehicle_type; }).set(function(v) { this.vehicle_type = v; });
vehicleSchema.virtual('registrationNumber').get(function() { return this.vehicle_registration_number; }).set(function(v) { this.vehicle_registration_number = v; });
vehicleSchema.virtual('color').get(function() { return this.vehicle_color; }).set(function(v) { this.vehicle_color = v; });

vehicleSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id;
  obj.vehicle_id = obj._id;
  obj.owner = obj.user_id;
  obj.make = obj.vehicle_make || obj.make;
  obj.model = obj.vehicle_model || obj.model;
  obj.year = obj.vehicle_year || obj.year;
  obj.vehicleType = obj.vehicle_type || obj.vehicleType;
  obj.registrationNumber = obj.vehicle_registration_number || obj.registrationNumber;
  obj.color = obj.vehicle_color || obj.color;
  return obj;
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;

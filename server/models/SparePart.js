const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  spare_part_name: {
    type: String,
    required: [true, 'Spare part name is required'],
    trim: true
  },
  partNumber: {
    type: String,
    trim: true
  },
  spare_part_category: {
    type: String,
    default: 'Other'
  },
  description: {
    type: String,
    trim: true
  },
  spare_part_vehicle_compatibility: {
    type: String,
    trim: true,
    default: 'All'
  },
  spare_part_type: {
    type: String,
    default: 'OEM'
  },
  spare_part_price: {
    type: Number,
    required: [true, 'Spare part price is required'],
    min: 0
  },
  spare_part_availability_status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  },
  serviceCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCenter',
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  }
}, {
  collection: 'tbl_spare_parts',
  timestamps: {
    createdAt: 'spare_part_created_at',
    updatedAt: 'spare_part_updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

sparePartSchema.virtual('spare_part_id').get(function() { return this._id; });

sparePartSchema.virtual('name').get(function() { return this.spare_part_name; }).set(function(v) { this.spare_part_name = v; });
sparePartSchema.virtual('category').get(function() { return this.spare_part_category; }).set(function(v) { this.spare_part_category = v; });
sparePartSchema.virtual('compatibility').get(function() { return this.spare_part_vehicle_compatibility; }).set(function(v) { this.spare_part_vehicle_compatibility = v; });
sparePartSchema.virtual('type').get(function() { return this.spare_part_type; }).set(function(v) { this.spare_part_type = v; });
sparePartSchema.virtual('price').get(function() { return this.spare_part_price; }).set(function(v) { this.spare_part_price = v; });
sparePartSchema.virtual('availability').get(function() { return this.spare_part_availability_status; }).set(function(v) { this.spare_part_availability_status = v; });

sparePartSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id;
  obj.spare_part_id = obj._id;
  obj.name = obj.spare_part_name || obj.name;
  obj.category = obj.spare_part_category || obj.category;
  obj.compatibility = obj.spare_part_vehicle_compatibility || obj.compatibility;
  obj.type = obj.spare_part_type || obj.type;
  obj.price = obj.spare_part_price || obj.price;
  obj.availability = obj.spare_part_availability_status || obj.availability;
  return obj;
};

const SparePart = mongoose.model('SparePart', sparePartSchema);
module.exports = SparePart;

const mongoose = require('mongoose');

const PartSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Part name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Tyres',
        'Tubes',
        'Batteries',
        'Brake Parts',
        'Engine Oil',
        'Filters',
        'Wiper Blades',
        'Wheel Alignment',
        'Accessories',
        'Other',
      ],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    compatibleVehicles: {
      type: [String],
      default: [],
    },
    unit: {
      type: String,
      enum: ['piece', 'set', 'litre', 'pair'],
      default: 'piece',
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    supplier: {
      name: { type: String, trim: true, default: '' },
      contact: { type: String, trim: true, default: '' },
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    warranty: {
      type: String,
      default: '12 Months Warranty',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    serviceCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCenter',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      }
    }
  }
);

// Text index for search across name, brand, and sku
PartSchema.index({ name: 'text', brand: 'text', sku: 'text' });

// Virtual: id getter
PartSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : undefined;
});

// Virtual: low-stock flag
PartSchema.virtual('isLowStock').get(function () {
  return this.stockQuantity <= this.reorderLevel;
});

// Backward compatibility virtuals for spare_part_* schema callers
PartSchema.virtual('spare_part_name').get(function () { return this.name; });
PartSchema.virtual('spare_part_category').get(function () { return this.category; });
PartSchema.virtual('spare_part_price').get(function () { return this.sellingPrice; });
PartSchema.virtual('spare_part_availability_status').get(function () {
  return this.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
});
PartSchema.virtual('spare_part_vehicle_compatibility').get(function () {
  return Array.isArray(this.compatibleVehicles) ? this.compatibleVehicles.join(', ') : 'All';
});
PartSchema.virtual('spare_part_type').get(function () { return this.brand || 'OEM'; });

module.exports = mongoose.model('Part', PartSchema);

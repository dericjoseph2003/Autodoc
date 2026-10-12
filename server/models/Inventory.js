const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    serviceCenterId: {
      type: String,
      required: [true, 'serviceCenterId is required'],
      ref: 'ServiceCenter',
      index: true,
    },
    partSku: {
      type: String,
      required: [true, 'partSku is required'],
      ref: 'Part',
      index: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'stockQuantity is required'],
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'sellingPrice is required'],
      min: 0,
    },
    lastRestockedAt: {
      type: Date,
      default: Date.now,
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

// Compound unique index on (serviceCenterId, partSku)
InventorySchema.index({ serviceCenterId: 1, partSku: 1 }, { unique: true });

// Virtual: id getter
InventorySchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : undefined;
});

// Virtual: isLowStock
InventorySchema.virtual('isLowStock').get(function () {
  return this.stockQuantity <= this.reorderLevel;
});

module.exports = mongoose.model('Inventory', InventorySchema);

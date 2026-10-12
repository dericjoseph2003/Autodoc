const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  brand: { type: String },
  price: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' },
}, { timestamps: true });

module.exports = mongoose.model('SparePart', sparePartSchema);
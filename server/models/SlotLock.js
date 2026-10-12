const mongoose = require('mongoose');

const slotLockSchema = new mongoose.Schema({
  service_center_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', required: true },
  date: { type: String, required: true },
  time_slot: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-deletes after 5 minutes
});

// Ensure only one lock per slot
slotLockSchema.index({ service_center_id: 1, date: 1, time_slot: 1 }, { unique: true });

module.exports = mongoose.model('SlotLock', slotLockSchema);

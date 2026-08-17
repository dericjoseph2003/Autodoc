const mongoose = require('mongoose');

const serviceHistorySchema = new mongoose.Schema({
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Service history must be linked to a vehicle (vehicle_id)']
  },
  service_center_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCenter',
    required: [true, 'Service history must be linked to a service center (service_center_id)']
  },
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  service_history_description: {
    type: String,
    trim: true
  },
  service_history_cost: {
    type: Number,
    min: 0
  },
  service_history_serviced_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'tbl_service_history',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Alias service_history_id to _id
serviceHistorySchema.virtual('service_history_id').get(function() { return this._id; });

const ServiceHistory = mongoose.model('ServiceHistory', serviceHistorySchema);
module.exports = ServiceHistory;

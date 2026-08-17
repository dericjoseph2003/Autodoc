const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Appointment must be linked to a user (user_id)']
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Appointment must be linked to a vehicle (vehicle_id)']
  },
  service_center_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCenter',
    required: [true, 'Appointment must be linked to a service center (service_center_id)']
  },
  appointment_service_type: {
    type: String,
    required: [true, 'Appointment service type is required']
  },
  appointment_date: {
    type: String,
    required: [true, 'Appointment date is required']
  },
  appointment_time_slot: {
    type: String,
    required: [true, 'Appointment time slot is required']
  },
  appointment_status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  collection: 'tbl_appointments',
  timestamps: {
    createdAt: 'appointment_created_at',
    updatedAt: 'appointment_updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

appointmentSchema.virtual('appointment_id').get(function() { return this._id; });

appointmentSchema.virtual('customer').get(function() { return this.user_id; }).set(function(v) { this.user_id = v; });
appointmentSchema.virtual('vehicle').get(function() { return this.vehicle_id; }).set(function(v) { this.vehicle_id = v; });
appointmentSchema.virtual('serviceCenter').get(function() { return this.service_center_id; }).set(function(v) { this.service_center_id = v; });
appointmentSchema.virtual('serviceType').get(function() { return this.appointment_service_type; }).set(function(v) { this.appointment_service_type = v; });
appointmentSchema.virtual('date').get(function() { return this.appointment_date; }).set(function(v) { this.appointment_date = v; });
appointmentSchema.virtual('time').get(function() { return this.appointment_time_slot; }).set(function(v) { this.appointment_time_slot = v; });
appointmentSchema.virtual('status').get(function() { return this.appointment_status; }).set(function(v) { this.appointment_status = v; });

appointmentSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id;
  obj.appointment_id = obj._id;
  obj.customer = obj.user_id;
  obj.vehicle = obj.vehicle_id;
  obj.serviceCenter = obj.service_center_id;
  obj.serviceType = obj.appointment_service_type || obj.serviceType;
  obj.date = obj.appointment_date || obj.date;
  obj.time = obj.appointment_time_slot || obj.time;
  obj.status = obj.appointment_status || obj.status;
  return obj;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;

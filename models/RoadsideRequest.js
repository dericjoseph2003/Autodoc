const mongoose = require('mongoose');

const roadsideRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  issueType: { type: String, enum: ['breakdown', 'accident', 'flatTire', 'other'], required: true },
  status: { type: String, enum: ['pending', 'assigned', 'inProgress', 'resolved'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' },
}, { timestamps: true });

roadsideRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RoadsideRequest', roadsideRequestSchema);
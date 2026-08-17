const mongoose = require('mongoose');

const roadsideRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Roadside request must be linked to a user (user_id)']
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: false
  },
  roadside_request_type: {
    type: String,
    required: [true, 'Roadside request type is required']
  },
  roadside_request_latitude: {
    type: Number,
    default: 0
  },
  roadside_request_longitude: {
    type: Number,
    default: 0
  },
  roadside_request_priority_score: {
    type: Number,
    default: 0
  },
  roadside_request_status: {
    type: String,
    enum: ['pending', 'active', 'assigned', 'in_progress', 'resolved'],
    default: 'pending'
  },
  location: {
    type: String,
    trim: true
  },
  vehicleDescription: {
    type: String,
    trim: true
  },
  issueDescription: {
    type: String,
    trim: true
  }
}, {
  collection: 'tbl_roadside_requests',
  timestamps: {
    createdAt: 'roadside_request_created_at',
    updatedAt: 'roadside_request_updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

roadsideRequestSchema.virtual('roadside_request_id').get(function() { return this._id; });

roadsideRequestSchema.virtual('user').get(function() { return this.user_id; }).set(function(v) { this.user_id = v; });
roadsideRequestSchema.virtual('vehicle').get(function() { return this.vehicle_id; }).set(function(v) { this.vehicle_id = v; });
roadsideRequestSchema.virtual('type').get(function() { return this.roadside_request_type; }).set(function(v) { this.roadside_request_type = v; });
roadsideRequestSchema.virtual('latitude').get(function() { return this.roadside_request_latitude; }).set(function(v) { this.roadside_request_latitude = v; });
roadsideRequestSchema.virtual('longitude').get(function() { return this.roadside_request_longitude; }).set(function(v) { this.roadside_request_longitude = v; });
roadsideRequestSchema.virtual('priorityScore').get(function() { return this.roadside_request_priority_score; }).set(function(v) { this.roadside_request_priority_score = v; });
roadsideRequestSchema.virtual('status').get(function() { return this.roadside_request_status; }).set(function(v) { this.roadside_request_status = v; });

roadsideRequestSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id;
  obj.roadside_request_id = obj._id;
  obj.user = obj.user_id;
  obj.vehicle = obj.vehicle_id;
  obj.type = obj.roadside_request_type || obj.type;
  obj.latitude = obj.roadside_request_latitude || obj.latitude;
  obj.longitude = obj.roadside_request_longitude || obj.longitude;
  obj.priorityScore = obj.roadside_request_priority_score || obj.priorityScore;
  obj.status = obj.roadside_request_status || obj.status;
  return obj;
};

const RoadsideRequest = mongoose.model('RoadsideRequest', roadsideRequestSchema);
module.exports = RoadsideRequest;

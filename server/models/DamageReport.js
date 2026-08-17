const mongoose = require('mongoose');

const damageReportSchema = new mongoose.Schema({
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Damage report must be linked to a vehicle (vehicle_id)']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Damage report must be linked to a user (user_id)']
  },
  damage_report_image_path: {
    type: String,
    required: [true, 'Damage report image path is required']
  },
  damage_report_damage_type: {
    type: String,
    trim: true
  },
  damage_report_severity_level: {
    type: String,
    trim: true
  },
  damage_report_estimated_repair_cost: {
    type: Number,
    min: 0
  },
  damage_report_confidence_score: {
    type: Number,
    min: 0,
    max: 1
  }
}, {
  collection: 'tbl_damage_reports',
  timestamps: {
    createdAt: 'damage_report_created_at',
    updatedAt: 'damage_report_updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Alias damage_report_id to _id
damageReportSchema.virtual('damage_report_id').get(function() { return this._id; });

const DamageReport = mongoose.model('DamageReport', damageReportSchema);
module.exports = DamageReport;

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Document must be linked to a vehicle (vehicle_id)']
  },
  vehicle_document_type: {
    type: String,
    enum: {
      values: ['RC', 'Insurance', 'PUC', 'Other'],
      message: 'Document type must be RC, Insurance, PUC, or Other'
    },
    required: [true, 'Document type is required']
  },
  vehicle_document_number: {
    type: String,
    trim: true
  },
  vehicle_document_file_path: {
    type: String,
    required: [true, 'Document file path is required']
  },
  vehicle_document_issue_date: {
    type: Date
  },
  vehicle_document_expiry_date: {
    type: Date
  },
  vehicle_document_uploaded_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'expired', 'pending', 'invalid'],
      message: 'Status must be active, expired, pending, or invalid'
    },
    default: 'active'
  }
}, {
  collection: 'tbl_vehicle_documents',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

documentSchema.virtual('vehicle_document_id').get(function() { return this._id; });

documentSchema.virtual('vehicle').get(function() { return this.vehicle_id; }).set(function(v) { this.vehicle_id = v; });
documentSchema.virtual('documentType').get(function() { return this.vehicle_document_type; }).set(function(v) { this.vehicle_document_type = v; });
documentSchema.virtual('documentNumber').get(function() { return this.vehicle_document_number; }).set(function(v) { this.vehicle_document_number = v; });
documentSchema.virtual('fileUrl').get(function() { return this.vehicle_document_file_path; }).set(function(v) { this.vehicle_document_file_path = v; });
documentSchema.virtual('issueDate').get(function() { return this.vehicle_document_issue_date; }).set(function(v) { this.vehicle_document_issue_date = v; });
documentSchema.virtual('expiryDate').get(function() { return this.vehicle_document_expiry_date; }).set(function(v) { this.vehicle_document_expiry_date = v; });
documentSchema.virtual('uploadDate').get(function() { return this.vehicle_document_uploaded_at; }).set(function(v) { this.vehicle_document_uploaded_at = v; });

documentSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id;
  obj.vehicle_document_id = obj._id;
  obj.vehicle = obj.vehicle_id;
  obj.documentType = obj.vehicle_document_type || obj.documentType;
  obj.documentNumber = obj.vehicle_document_number || obj.documentNumber;
  obj.fileUrl = obj.vehicle_document_file_path || obj.fileUrl;
  obj.issueDate = obj.vehicle_document_issue_date || obj.issueDate;
  obj.expiryDate = obj.vehicle_document_expiry_date || obj.expiryDate;
  obj.uploadDate = obj.vehicle_document_uploaded_at || obj.uploadDate;
  return obj;
};

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;

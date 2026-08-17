const Document = require('../models/Document');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { createNotificationInternal } = require('./notificationController');
const fs = require('fs');
const path = require('path');

/**
 * Upload a document for a vehicle
 * POST /api/documents
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const { vehicleId, vehicle_id, documentType, vehicle_document_type, documentNumber, vehicle_document_number, issueDate, vehicle_document_issue_date, expiryDate, vehicle_document_expiry_date } = req.body;

    const targetVehicleId = vehicle_id || vehicleId;
    const targetDocType = vehicle_document_type || documentType;
    const targetDocNumber = vehicle_document_number || documentNumber;
    const targetIssueDate = vehicle_document_issue_date || issueDate;
    const targetExpiryDate = vehicle_document_expiry_date || expiryDate;

    if (!targetVehicleId || !targetDocType) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Please provide vehicle_id and vehicle_document_type'
      });
    }

    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const currentUserId = (req.user._id || req.user.user_id || req.user.id).toString();
    const ownerId = (vehicle.user_id._id || vehicle.user_id).toString();

    if (ownerId !== currentUserId && req.user.user_role !== 'admin') {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this vehicle'
      });
    }

    const filePath = `/uploads/${req.file.filename}`;

    const document = await Document.create({
      vehicle_id: targetVehicleId,
      vehicle_document_type: targetDocType,
      vehicle_document_number: targetDocNumber || undefined,
      vehicle_document_file_path: filePath,
      vehicle_document_issue_date: targetIssueDate ? new Date(targetIssueDate) : undefined,
      vehicle_document_expiry_date: targetExpiryDate ? new Date(targetExpiryDate) : undefined,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('File cleanup failed in error handler:', err);
      }
    }
    next(error);
  }
};

/**
 * List all documents for a specific vehicle
 * GET /api/documents/vehicle/:vehicleId
 */
const listDocuments = async (req, res, next) => {
  try {
    const targetVehicleId = req.params.vehicleId || req.params.vehicle_id;

    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const currentUserId = (req.user._id || req.user.user_id || req.user.id).toString();
    const ownerId = (vehicle.user_id._id || vehicle.user_id).toString();

    if (ownerId !== currentUserId && req.user.user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this vehicle'
      });
    }

    const documents = await Document.find({ vehicle_id: targetVehicleId }).sort({ vehicle_document_uploaded_at: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get documents expiring in the next 30 days
 * GET /api/documents/expiring
 */
const getExpiringDocuments = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let vehicleQuery = {};
    if (req.user.user_role !== 'admin') {
      vehicleQuery.user_id = req.user._id || req.user.user_id || req.user.id;
    }
    const vehicles = await Vehicle.find(vehicleQuery);
    const vehicleIds = vehicles.map(v => v._id);

    const documents = await Document.find({
      vehicle_id: { $in: vehicleIds },
      status: 'active',
      vehicle_document_expiry_date: { $gte: now, $lte: thirtyDaysFromNow }
    }).populate('vehicle_id');

    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const vehicle = await Vehicle.findById(document.vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Associated vehicle not found'
      });
    }

    const currentUserId = (req.user._id || req.user.user_id || req.user.id).toString();
    const ownerId = vehicle.user_id.toString();

    if (ownerId !== currentUserId && req.user.user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete this document'
      });
    }

    const filePath = document.vehicle_document_file_path || document.fileUrl;
    if (filePath) {
      const filename = path.basename(filePath);
      const localPath = path.join(__dirname, '../uploads', filename);

      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch (err) {
          console.error(`Failed to delete physical file: ${localPath}`, err);
        }
      }
    }

    await Document.findByIdAndDelete(document._id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * System-wide check for expiring documents
 */
const checkAllExpiringDocumentsAndNotify = async () => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const documents = await Document.find({
      status: 'active',
      vehicle_document_expiry_date: { $gte: now, $lte: thirtyDaysFromNow }
    }).populate({
      path: 'vehicle_id',
      populate: { path: 'user_id' }
    });

    console.log(`[Expiry Job] Found ${documents.length} document(s) expiring within the next 30 days.`);

    let notificationCount = 0;
    for (const doc of documents) {
      const vehicle = doc.vehicle_id;
      if (vehicle && vehicle.user_id) {
        const owner = vehicle.user_id;
        const expiryDateVal = doc.vehicle_document_expiry_date || doc.expiryDate;
        const daysLeft = Math.ceil((new Date(expiryDateVal) - now) / (1000 * 60 * 60 * 24));
        
        await createNotificationInternal(
          owner._id,
          'Document Expiring Soon',
          `Your vehicle ${vehicle.vehicle_make} ${vehicle.vehicle_model} (${vehicle.vehicle_registration_number}) has a ${doc.vehicle_document_type} document expiring in ${daysLeft} days (on ${new Date(expiryDateVal).toLocaleDateString()}).`,
          'system'
        );
        notificationCount++;
      }
    }
    console.log(`[Expiry Job] Dispatched ${notificationCount} notification(s).`);
    return { success: true, documentsFound: documents.length, notificationsSent: notificationCount };
  } catch (error) {
    console.error('[Expiry Job Error]:', error);
    throw error;
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  getExpiringDocuments,
  deleteDocument,
  checkAllExpiringDocumentsAndNotify
};

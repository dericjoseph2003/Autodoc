const express = require('express');
const router = express.Router();
const { uploadDocument, listDocuments, getExpiringDocuments, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// 1. Get expiring documents (must be before :vehicleId / :id to prevent parameter conflict)
router.get('/expiring', getExpiringDocuments);

// 2. Upload a document (file parameter name should be 'file')
router.post('/', upload.single('file'), uploadDocument);

// 3. Get all documents for a vehicle
router.get('/vehicle/:vehicleId', listDocuments);

// 4. Delete a document
router.delete('/:id', deleteDocument);

module.exports = router;

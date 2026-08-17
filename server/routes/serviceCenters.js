const express = require('express');
const router = express.Router();
const {
  registerServiceCenter,
  approveServiceCenter,
  deactivateServiceCenter,
  listServiceCenters,
  updateApprovalStatus,
  getPendingServiceCenters,
  getServiceCenterDetail
} = require('../controllers/serviceCenterController');
const { protect, authorize } = require('../middleware/auth');

// Protected list of service centers
router.get('/', protect, listServiceCenters);

// Admin-only routes (defined before parameter routes to prevent conflicts)
router.get('/pending', protect, authorize('admin'), getPendingServiceCenters);
router.get('/:id/detail', protect, authorize('admin'), getServiceCenterDetail);

// Register service center - only service_center role or admin can register
router.post('/', protect, authorize('service_center', 'admin'), registerServiceCenter);

// Admin-only approval and deactivation routes
router.patch('/:id/approve', protect, authorize('admin'), approveServiceCenter);
router.patch('/:id/deactivate', protect, authorize('admin'), deactivateServiceCenter);
router.put('/:id/approval', protect, authorize('admin'), updateApprovalStatus);

module.exports = router;

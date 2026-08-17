const express = require('express');
const router = express.Router();
const {
  createRoadsideRequest,
  listRoadsideRequests,
  updateRoadsideStatus
} = require('../controllers/roadsideController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Owner creates; all authenticated users can list (filtered by role inside controller)
router.post('/', authorize('owner'), createRoadsideRequest);
router.get('/', listRoadsideRequests);
router.patch('/:id/status', authorize('service_center', 'admin'), updateRoadsideStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentUsers,
  getPendingServiceCentersSummary,
  listAllUsers
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, authorize('admin'), getDashboardStats);
router.get('/recent-users', protect, authorize('admin'), getRecentUsers);
router.get('/pending-summary', protect, authorize('admin'), getPendingServiceCentersSummary);
router.get('/users', protect, authorize('admin'), listAllUsers);

module.exports = router;

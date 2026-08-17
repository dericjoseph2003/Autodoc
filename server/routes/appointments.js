const express = require('express');
const router = express.Router();
const {
  createAppointment,
  listAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Owner or admin can create; service center, admin can see all
router.post('/', authorize('owner', 'admin'), createAppointment);
router.get('/', listAppointments);
router.patch('/:id/status', authorize('service_center', 'admin'), updateAppointmentStatus);

module.exports = router;

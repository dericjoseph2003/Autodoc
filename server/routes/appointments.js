const express = require('express');
const router = express.Router();
const {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
  getAvailableSlots,
  lockSlot
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Public or owner route to check open time slots
router.get('/available-slots', getAvailableSlots);
router.post('/lock-slot', lockSlot);

// All remaining appointment routes require authentication
router.use(protect);

// Owner or admin can create; service center, admin can see all
router.post('/', authorize('owner', 'admin'), createAppointment);
router.get('/', listAppointments);
router.patch('/:id/status', authorize('owner', 'service_center', 'admin'), updateAppointmentStatus);


module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', authorize('owner', 'admin'), createVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', authorize('owner', 'admin'), updateVehicle);
router.delete('/:id', authorize('owner', 'admin'), deleteVehicle);

module.exports = router;

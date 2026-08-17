const express = require('express');
const router = express.Router();
const {
  listSpareParts,
  createSparePart
} = require('../controllers/sparePartController');
const { protect, authorize } = require('../middleware/auth');

// Public list of spare parts
router.get('/', listSpareParts);

// Only admin and service centers can create spare part listings
router.post('/', protect, authorize('admin', 'service_center'), createSparePart);

module.exports = router;

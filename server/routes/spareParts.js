const express = require('express');
const router = express.Router();
const {
  listSpareParts,
  createSparePart,
  updateSparePart,
  deleteSparePart
} = require('../controllers/sparePartController');
const { protect, authorize } = require('../middleware/auth');

// Public list of spare parts
router.get('/', listSpareParts);

// Protected endpoints for admin and service centers
router.post('/', protect, authorize('admin', 'service_center'), createSparePart);
router.put('/:id', protect, authorize('admin', 'service_center'), updateSparePart);
router.delete('/:id', protect, authorize('admin', 'service_center'), deleteSparePart);

module.exports = router;

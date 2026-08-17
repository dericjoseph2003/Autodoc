const express = require('express');
const router = express.Router();
const { listServiceHistory, createServiceHistory } = require('../controllers/serviceHistoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, listServiceHistory);
router.post('/', protect, createServiceHistory);

module.exports = router;

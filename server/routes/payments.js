const express = require('express');
const router = express.Router();
const { createMockPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/mock', protect, createMockPayment);

module.exports = router;

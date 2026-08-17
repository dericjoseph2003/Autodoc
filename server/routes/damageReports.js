const express = require('express');
const router = express.Router();
const { listDamageReports, createDamageReport } = require('../controllers/damageReportController');
const { protect } = require('../middleware/auth');

router.get('/', protect, listDamageReports);
router.post('/', protect, createDamageReport);

module.exports = router;

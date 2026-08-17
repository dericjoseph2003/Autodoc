const express = require('express');
const router = express.Router();
const { listNotifications, createNotification, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes here require authentication
router.use(protect);

router.get('/', listNotifications);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);

module.exports = router;

const Notification = require('../models/Notification');

/**
 * Placeholder function for Firebase Cloud Messaging (FCM)
 */
const sendPushNotificationPlaceholder = async (userId, title, message) => {
  console.log(`[FCM Placeholder] Sending push notification to User ID ${userId}:`);
  console.log(`  Title:   "${title}"`);
  console.log(`  Message: "${message}"`);
  console.log(`[FCM Placeholder] Push notification delivered successfully.`);
};

/**
 * Helper function for internal server controllers to create notifications
 * @param {string} userId - User to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, appointment, roadside, system)
 */
const createNotificationInternal = async (userId, title, message, type = 'info') => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type
    });

    sendPushNotificationPlaceholder(userId, title, message).catch(err => {
      console.error('FCM push notification placeholder failed:', err);
    });

    return notification;
  } catch (error) {
    console.error('Failed to create internal notification:', error);
    throw error;
  }
};

/**
 * Automated helper to verify document expiry and trigger user notifications
 * @param {string} userId
 */
const checkUserExpiringDocumentsAndNotify = async (userId) => {
  try {
    const Vehicle = require('../models/Vehicle');
    const Document = require('../models/Document');

    const vehicles = await Vehicle.find({ user_id: userId });
    if (!vehicles || vehicles.length === 0) return;

    const vehicleIds = vehicles.map(v => v._id);

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringDocs = await Document.find({
      vehicle_id: { $in: vehicleIds },
      status: 'active',
      vehicle_document_expiry_date: { $gte: new Date(), $lte: thirtyDaysFromNow }
    }).populate('vehicle_id');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const doc of expiringDocs) {
      const vehicle = doc.vehicle_id;
      if (!vehicle) continue;

      const recentNotification = await Notification.findOne({
        user_id: userId,
        notification_created_at: { $gte: sevenDaysAgo },
        title: 'Document Expiring Soon',
        message: { 
          $regex: new RegExp(`${vehicle.vehicle_registration_number}.*${doc.vehicle_document_type}`, 'i') 
        }
      });

      if (!recentNotification) {
        const expiryDateVal = doc.vehicle_document_expiry_date || doc.expiryDate;
        await createNotificationInternal(
          userId,
          'Document Expiring Soon',
          `The ${doc.vehicle_document_type} document for vehicle ${vehicle.vehicle_make} ${vehicle.vehicle_model} (${vehicle.vehicle_registration_number}) is expiring on ${new Date(expiryDateVal).toLocaleDateString()}.`,
          'system'
        );
      }
    }
  } catch (err) {
    console.error('Error checking expiring documents and notifying:', err);
  }
};

/**
 * List all notifications for the authenticated user
 * GET /api/notifications
 */
const listNotifications = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.user_id || req.user.id;
    await checkUserExpiringDocumentsAndNotify(currentUserId);

    const notifications = await Notification.find({ user_id: currentUserId }).sort({ notification_created_at: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new notification (API endpoint)
 * POST /api/notifications
 */
const createNotification = async (req, res, next) => {
  try {
    const { userId, user_id, title, message, type } = req.body;
    const targetUserId = user_id || userId;

    if (!targetUserId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user_id, title, and message'
      });
    }

    const notification = await createNotificationInternal(targetUserId, title, message, type);

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.user_id || req.user.id;
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: currentUserId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotificationInternal,
  listNotifications,
  createNotification,
  markAsRead
};

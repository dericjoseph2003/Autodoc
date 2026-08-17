const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must be linked to a user (user_id)']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ['info', 'appointment', 'roadside', 'system'],
      message: 'Type must be info, appointment, roadside, or system'
    },
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'tbl_notifications',
  timestamps: {
    createdAt: 'notification_created_at',
    updatedAt: 'notification_updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

notificationSchema.virtual('notification_id').get(function() { return this._id; });
notificationSchema.virtual('user').get(function() { return this.user_id; }).set(function(v) { this.user_id = v; });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;

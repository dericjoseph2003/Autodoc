const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    enum: ['mock_card', 'cash', 'razorpay', 'mock_fallback'],
    default: 'mock_card'
  },
  transaction_id: {
    type: String
  }
}, {
  collection: 'tbl_payments',
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);

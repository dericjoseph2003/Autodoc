const Payment = require('../models/Payment');
const Razorpay = require('razorpay');

exports.createMockPayment = async (req, res, next) => {
  try {
    const { amount, currency, payment_method } = req.body;
    const userId = req.user.id || req.user._id || req.user.user_id;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const paymentAmount = (amount || 500) * 100;
    const paymentCurrency = currency || "INR";

    // 1. If we have NO keys at all, fallback
    if (!keyId) {
      const payment = new Payment({
         user_id: userId,
         amount: amount || 500,
         currency: paymentCurrency,
         status: 'completed',
         payment_method: 'mock_fallback',
         transaction_id: `txn_fallback_${Date.now()}`
      });
      await payment.save();
      return res.status(200).json({
        success: true,
        message: "Fallback to mock due to missing Razorpay keys",
        paymentId: payment._id,
        isFallback: true
      });
    }

    // 2. If we have keyId but NO keySecret, do payment without order
    if (keyId && !keySecret) {
      const payment = new Payment({
        user_id: userId,
        amount: amount || 500,
        currency: paymentCurrency,
        status: 'pending',
        payment_method: 'razorpay',
        transaction_id: `txn_no_order_${Date.now()}`
      });
      await payment.save();

      return res.status(200).json({
        success: true,
        orderId: null,
        amount: paymentAmount,
        currency: paymentCurrency,
        key: keyId,
        paymentId: payment._id
      });
    }

    // 3. We have both keys, create order
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const options = {
      amount: paymentAmount,
      currency: paymentCurrency,
      receipt: `receipt_mock_${Date.now()}`
    };

    try {
      const order = await rzp.orders.create(options);
      
      const payment = new Payment({
        user_id: userId,
        amount: amount || 500,
        currency: paymentCurrency,
        status: 'pending',
        payment_method: 'razorpay',
        transaction_id: order.id
      });
      await payment.save();

      return res.status(200).json({
        success: true,
        orderId: order.id,
        amount: options.amount,
        currency: options.currency,
        key: keyId,
        paymentId: payment._id
      });
    } catch (rzpErr) {
       console.error("Razorpay Error:", rzpErr);
       // Fallback for invalid keys
       const payment = new Payment({
         user_id: userId,
         amount: amount || 500,
         currency: paymentCurrency,
         status: 'completed',
         payment_method: 'mock_fallback',
         transaction_id: `txn_fallback_${Date.now()}`
       });
       await payment.save();
       return res.status(200).json({
         success: true,
         message: "Fallback to mock due to invalid Razorpay keys",
         paymentId: payment._id,
         isFallback: true
       });
    }
  } catch (error) {
    next(error);
  }
};

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Validate Razorpay keys on startup
const rzpKeyId = process.env.RAZORPAY_KEY_ID;
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!rzpKeyId || rzpKeyId === 'your_razorpay_key_id_here' || !rzpKeySecret || rzpKeySecret === 'your_razorpay_key_secret_here') {
  console.warn('⚠️  Razorpay API keys not configured! Online payments will not work.');
  console.warn('   Get keys from: https://dashboard.razorpay.com/app/keys');
}

const razorpay = new Razorpay({
  key_id: rzpKeyId,
  key_secret: rzpKeySecret
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    // Check keys before attempting
    if (!rzpKeyId || rzpKeyId === 'your_razorpay_key_id_here') {
      return res.status(500).json({
        error: 'Razorpay API keys not configured',
        details: 'Please add valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env file. Get keys from https://dashboard.razorpay.com/app/keys'
      });
    }

    console.log('💳 Creating Razorpay order with data:', req.body);

    const { items, total, deliveryCharge, address, userId, userEmail } = req.body;

    if (!total) {
      return res.status(400).json({ error: 'Order amount is required' });
    }

    // Amount in paise (Razorpay expects amount in paise, not rupees)
    const amountInPaise = Math.round(total * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        items: JSON.stringify(items).slice(0, 500),
        userId: userId || 'guest',
        userEmail: userEmail || 'guest@example.com'
      }
    };

    console.log('📦 Order options:', orderOptions);

    const order = await razorpay.orders.create(orderOptions);

    console.log('✅ Razorpay order created:', order.id);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: rzpKeyId
    });
  } catch (err) {
    // Razorpay SDK errors use err.error.description, not err.message
    const errorMsg = err?.error?.description || err?.message || JSON.stringify(err);
    console.error('❌ Failed to create order:', errorMsg);
    console.error('❌ Full error:', JSON.stringify(err, null, 2));
    res.status(500).json({ error: 'Failed to create payment order', details: errorMsg });
  }
});

// Verify payment signature
router.post('/verify-payment', async (req, res) => {
  try {
    console.log('🔍 Verifying payment signature...');

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpaySignature) {
      console.log('✅ Payment verified successfully');
      res.json({ success: true, message: 'Payment verified' });
    } else {
      console.error('❌ Signature mismatch');
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

module.exports = router;

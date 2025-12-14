const express = require('express');
const router = express.Router();
const { createPaymentIntent } = require('../services/stripeService');
const { createOrder } = require('../services/orderService');
const pool = require('../config/db');

/**
 * POST /api/checkout
 * Create order and Stripe Payment Intent
 * Body: { email, items: [{product_id, quantity}, ...] }
 */
router.post('/', async (req, res) => {
  try {
    const { email, items } = req.body;

    // Validation
    if (!email || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: email, items (array)',
      });
    }

    // Step 1: Create order with items
    const order = await createOrder(email, items);
    const { order_id, total_amount } = order;

    // Step 2: Create payment intent with order ID metadata
    const paymentIntent = await createPaymentIntent(
      Math.round(total_amount * 100), // Convert to cents
      { order_id: order_id.toString(), email }
    );

    // Step 3: Link order to payment intent
    await pool.query(
      'UPDATE orders SET stripe_payment_intent_id = ? WHERE id = ?',
      [paymentIntent.id, order_id]
    );

    console.log(`✅ Payment Intent ${paymentIntent.id} linked to order ${order_id}`);

    res.json({
      orderId: order_id,
      totalAmount: total_amount,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Checkout error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyWebhookSignature } = require('../services/stripeService');
const { updateOrderStatus } = require('../services/orderService');
const pool = require('../config/db');

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler - receives and processes events
 * Implements idempotency by tracking webhook events
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    let event;
    try {
      event = verifyWebhookSignature(req.body, signature);
    } catch (error) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const eventId = event.id;
    const eventType = event.type;

    console.log(`📨 Webhook received: ${eventType} (${eventId})`);

    // Check idempotency - has this event been processed?
    const [existingEvent] = await pool.query(
      'SELECT id, status FROM webhook_events WHERE stripe_event_id = ?',
      [eventId]
    );

    if (existingEvent.length > 0) {
      console.log(`⚠️  DUPLICATE webhook detected for ${eventId} - ignoring`);
      // Return 200 to acknowledge, but don't reprocess
      return res.json({ received: true, duplicate: true });
    }

    // Process based on event type
    switch (eventType) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event, eventId);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event, eventId);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${eventType}`);
        // Still log it for auditing
        await logWebhookEvent(eventId, 'unhandled', 'processed');
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentSucceeded(event, eventId) {
  try {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.order_id;

    if (!orderId) {
      console.warn('⚠️  Payment succeeded but no order_id in metadata');
      await logWebhookEvent(eventId, 'payment_intent.succeeded', 'logged_no_order');
      return;
    }

    console.log(`✅ Payment succeeded for order ${orderId}`);

    // Log this webhook event for idempotency
    await logWebhookEvent(eventId, 'payment_intent.succeeded', 'processed', orderId);

    // Update order status to paid
    await updateOrderStatus(orderId, 'paid');
  } catch (error) {
    console.error('❌ Error handling payment succeeded:', error.message);
    await logWebhookEvent(eventId, 'payment_intent.succeeded', 'error');
    throw error;
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(event, eventId) {
  try {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.order_id;

    if (!orderId) {
      console.warn('⚠️  Payment failed but no order_id in metadata');
      await logWebhookEvent(eventId, 'payment_intent.payment_failed', 'logged_no_order');
      return;
    }

    console.log(`❌ Payment failed for order ${orderId}`);

    // Log this webhook event for idempotency
    await logWebhookEvent(eventId, 'payment_intent.payment_failed', 'processed', orderId);

    // Update order status to failed
    await updateOrderStatus(orderId, 'payment_failed');
  } catch (error) {
    console.error('❌ Error handling payment failed:', error.message);
    await logWebhookEvent(eventId, 'payment_intent.payment_failed', 'error');
    throw error;
  }
}

/**
 * Log webhook event to database for idempotency and audit trail
 */
async function logWebhookEvent(eventId, eventType, status, orderId = 0) {
  try {
    await pool.query(
      'INSERT INTO webhook_events (stripe_event_id, event_type, order_id, status) VALUES (?, ?, ?, ?)',
      [eventId, eventType, orderId, status]
    );
  } catch (error) {
    // If duplicate key error (event already exists), that's fine
    if (error.code !== 'ER_DUP_ENTRY') {
      console.error('❌ Error logging webhook event:', error.message);
    }
  }
}

module.exports = router;

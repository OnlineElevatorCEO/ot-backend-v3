const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Payment Intent for checkout
 * @param {number} amount - Amount in cents
 * @param {object} metadata - Custom metadata (order_id, etc.)
 * @returns {Promise<object>} Payment Intent object
 */
async function createPaymentIntent(amount, metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata,
    });
    return paymentIntent;
  } catch (error) {
    console.error('❌ Error creating payment intent:', error.message);
    throw error;
  }
}

/**
 * Verify webhook signature from Stripe
 * @param {string} body - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {object} Parsed event object
 */
function verifyWebhookSignature(body, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error.message);
    throw error;
  }
}

module.exports = {
  createPaymentIntent,
  verifyWebhookSignature,
  stripe,
};

const express = require('express');
const router = express.Router();
const { getOrderById } = require('../services/orderService');

/**
 * GET /api/orders/:orderId
 * Retrieve order details with items
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('❌ Error retrieving order:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

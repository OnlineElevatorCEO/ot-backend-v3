const pool = require('../config/db');

/**
 * Create a new order with items
 * @param {string} email - Customer email
 * @param {array} items - Array of {product_id, quantity}
 * @returns {Promise<object>} Order object with order_id and total_amount
 */
async function createOrder(email, items) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Calculate total amount
    let totalAmount = 0;
    const itemsWithPrice = [];

    for (const item of items) {
      const [products] = await connection.query(
        'SELECT id, price FROM products WHERE id = ?',
        [item.product_id]
      );

      if (products.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = products[0];
      const subtotal = product.price * (item.quantity || 1);
      totalAmount += subtotal;

      itemsWithPrice.push({
        product_id: item.product_id,
        quantity: item.quantity || 1,
        unit_price: product.price,
        subtotal,
      });
    }

    // Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_email, total_amount, status) VALUES (?, ?, ?)',
      [email, totalAmount, 'pending']
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of itemsWithPrice) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );
    }

    await connection.commit();

    console.log(`✅ Order ${orderId} created with ${items.length} items, total: $${totalAmount}`);

    return {
      order_id: orderId,
      email,
      total_amount: totalAmount,
      items: itemsWithPrice,
    };
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating order:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get order by ID with items
 */
async function getOrderById(orderId) {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return null;
    }

    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    return {
      ...orders[0],
      items,
    };
  } catch (error) {
    console.error('❌ Error fetching order:', error.message);
    throw error;
  }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status) {
  try {
    await pool.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );

    console.log(`✅ Order ${orderId} status updated to: ${status}`);
  } catch (error) {
    console.error('❌ Error updating order status:', error.message);
    throw error;
  }
}

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
};

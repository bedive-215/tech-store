const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const OrderRepository = require('../repositories/OrderRepository');
const OrderItemRepository = require('../repositories/OrderItemRepository');
const CouponRepository = require('../repositories/CouponRepository');
const PaymentRepository = require('../repositories/PaymentRepository');

const OrderService = {
  /**
   * Create order with transaction
   */
  async createOrder(userId, { items = [], coupon_code = null, shipping_address = null, payment_method = null }) {
  if (!items || items.length === 0) throw new Error('items required');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Tính tổng giá
    let totalPrice = 0;
    items.forEach(it => {
      totalPrice += Number(it.price) * Number(it.quantity);
    });

    // Coupon
    let discountAmount = 0;
    let appliedCoupon = null;
    if (coupon_code) {
      const coupon = await CouponRepository.findByCode(coupon_code);
      if (!coupon) throw new Error('Coupon not found');

      const now = new Date();
      if (coupon.start_at && new Date(coupon.start_at) > now) throw new Error('Coupon not started yet');
      if (coupon.end_at && new Date(coupon.end_at) < now) throw new Error('Coupon expired');
      if (coupon.quantity !== null && Number(coupon.quantity) <= 0) throw new Error('Coupon out of stock');

      if (coupon.discount_percent) {
        // Tính giảm giá chính xác dựa trên totalPrice
        discountAmount = Math.floor((Number(coupon.discount_percent) / 100) * totalPrice);
      }

      appliedCoupon = { code: coupon.code, discount_amount: discountAmount };

      // Giảm số lượng coupon 1 lần
      await CouponRepository.decreaseQuantity(conn, coupon.id);
    }

    const finalPrice = Math.max(0, totalPrice - discountAmount);

    // Tạo order
    const orderId = `O-${uuidv4()}`;
    const now = new Date();
    const order = {
      id: orderId,
      user_id: userId,
      status: 'pending',
      total_price: totalPrice,
      discount_amount: discountAmount,
      created_at: now,
      updated_at: now,
      shipping_address: shipping_address || null
    };
    await OrderRepository.create(conn, order);

    // Tạo order items
    const itemsToInsert = items.map(it => ({
      id: `OI-${uuidv4()}`,
      order_id: orderId,
      product_id: it.product_id,
      quantity: it.quantity,
      price: it.price
    }));
    if (itemsToInsert.length) await OrderItemRepository.bulkCreate(conn, itemsToInsert);

    // Tạo payment pending nếu có
    let payment = null;
    if (payment_method) {
      const paymentObj = {
        id: `PAY-${uuidv4()}`,
        order_id: orderId,
        method: payment_method,
        status: 'pending',
        transaction_id: null,
        created_at: now
      };
      await PaymentRepository.create(conn, paymentObj);
      payment = paymentObj;
    }

    await conn.commit();

    return {
      order_id: orderId,
      user_id: userId,
      total_price: totalPrice,
      discount: discountAmount,
      final_price: finalPrice,
      status: 'pending',
      coupon: appliedCoupon, // trả thông tin coupon
      created_at: now.toISOString()
    };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
},


  async listUserOrders(userId, { page = 1, limit = 10, status = null } = {}) {
    const { rows, total } = await OrderRepository.findByUser(userId, { page, limit, status });
    const orders = rows.map(r => ({
      order_id: r.id,
      total_price: r.total_price,
      status: r.status,
      created_at: r.created_at
    }));
    return { orders, total };
  },

  async getOrderDetail(orderId) {
    const order = await OrderRepository.findById(orderId);
    if (!order) return null;

    const items = await OrderItemRepository.findByOrder(orderId);
    const payments = await PaymentRepository.findByOrder(orderId);

    return {
      order_id: order.id,
      items: items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name || null,
        quantity: i.quantity,
        price: i.price
      })),
      total_price: order.total_price,
      status: order.status,
      shipping_address: order.shipping_address,
      payment: payments.length ? {
        payment_id: payments[0].id,
        method: payments[0].method,
        status: payments[0].status,
        transaction_id: payments[0].transaction_id,
        paid_at: payments[0].created_at
      } : null
    };
  },

  async cancelOrder(orderId, reason = null) {
    const extra = { 
      cancelled_at: new Date(), 
      cancel_reason: reason || null 
    };
    await OrderRepository.updateStatus(null, orderId, 'cancelled', extra);
    const order = await OrderRepository.findById(orderId);
    return {
      order_id: order.id,
      status: order.status,
      cancelled_at: order.cancelled_at
    };
  }
};

module.exports = OrderService;
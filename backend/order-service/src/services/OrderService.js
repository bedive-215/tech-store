const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const rabbitmq = require('../config/rabbitmq');
const crypto = require('crypto');

const OrderRepository = require('../repositories/OrderRepository');
const OrderItemRepository = require('../repositories/OrderItemRepository');
const CouponRepository = require('../repositories/CouponRepository');

const promiseMap = new Map();

const OrderService = {

  async createOrder(userId, { items = [], coupon_code = null, shipping_address = null }) {
    if (!items.length) throw new Error('items required');

    const conn = await pool.getConnection();
    let orderId;
    let appliedCoupon = null;
    let discountAmount = 0;
    let totalPrice = 0;
    let finalPrice = 0;

    try {
      // Check price from product service
      const priceCorrelationId = crypto.randomUUID();
      const pricePromise = new Promise((resolve, reject) => {
        promiseMap.set(priceCorrelationId, resolve);
        setTimeout(() => reject(new Error('Product service timeout')), 5000);
      });

      await rabbitmq.publish('check_price', {
        product_id: items.map(i => i.product_id),
        correlationId: priceCorrelationId
      });

      const products = await pricePromise;
      const productMap = new Map(products.map(p => [p.id, p]));

      const mergedItems = items.map(it => {
        const p = productMap.get(it.product_id);
        if (!p || !p.exists) throw new Error(`Product ${it.product_id} not found`);
        if (it.quantity > p.stock) throw new Error(`Product ${it.product_id} out of stock`);

        const itemTotal = p.price * it.quantity;
        totalPrice += itemTotal;

        return { ...it, price: p.price, name: p.name };
      });

      // Chi tinh gia giam khong tru so luong ma trong database
      if (coupon_code) {
        const coupon = await CouponRepository.findByCode(conn, coupon_code);

        if (coupon) {

          const now = new Date();

          if (now < coupon.start_at || now > coupon.end_at) {
            throw new Error('Coupon is expired or not active');
          }

          if (coupon.quantity <= 0) {
            throw new Error('Coupon has been fully redeemed');
          }

          if (totalPrice < coupon.min_order_value) {
            throw new Error(`Order total must be at least ${coupon.min_order_value}`);
          }

          let rawDiscount =
            coupon.discount_type === 'PERCENT'
              ? Math.floor(totalPrice * coupon.discount_value / 100)
              : coupon.discount_value;

          if (coupon.max_discount && rawDiscount > coupon.max_discount) {
            rawDiscount = coupon.max_discount;
          }
          discountAmount = Math.min(rawDiscount, totalPrice);

          appliedCoupon = coupon;
        }
      }

      finalPrice = totalPrice - discountAmount;
      orderId = uuidv4();

      // Database transaction
      await conn.beginTransaction();

      await OrderRepository.create(conn, {
        id: orderId,
        user_id: userId,
        status: 'pending',
        total_price: totalPrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        shipping_address
      });

      await OrderItemRepository.bulkCreate(
        conn,
        mergedItems.map(it => ({
          id: uuidv4(),
          order_id: orderId,
          product_id: it.product_id,
          quantity: it.quantity,
          price: it.price,
          product_name: it.name
        }))
      );

      await conn.commit();

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    // Reserve stock sau khi commit transaction
    const stockCorrelationId = crypto.randomUUID();
    const stockPromise = new Promise((resolve, reject) => {
      promiseMap.set(stockCorrelationId, resolve);
      setTimeout(() => reject(new Error('Reserve stock timeout')), 5000);
    });

    await rabbitmq.publish('reserve_stock', {
      order_id: orderId,
      items,
      correlationId: stockCorrelationId
    });

    const stockResult = await stockPromise;

    if (!stockResult.success) {
      await OrderRepository.updateStatus(pool, orderId, 'cancelled', {
        cancel_reason: stockResult.reason
      });
      throw new Error(stockResult.reason);
    }

    // Chi giam so luong ma giam do va set confirmed neu giu hang thanh cong 
    await OrderRepository.updateStatus(pool, orderId, 'confirmed');

    if (appliedCoupon) {
      await CouponRepository.decreaseQuantity(conn, appliedCoupon.id);
    }

    return {
      order_id: orderId,
      status: 'confirmed',
      total_price: totalPrice,
      discount_amount: discountAmount,
      final_price: finalPrice
    };
  },

  async getOrderById(orderId) {
    if (!orderId) return null;

    const order = await OrderRepository.findById(orderId);
    if (!order) return null;

    const items = await OrderItemRepository.findByOrder(orderId);

    // Lấy thông tin của user có order này
    const correlationId = crypto.randomUUID();
    const dataPromise = new Promise((resolve, reject) => {
      promiseMap.set(correlationId, resolve);
      setTimeout(() => {
        if (promiseMap.has(correlationId)) {
          promiseMap.delete(correlationId);
          reject(new Error("Product service timeout", 504));
        }
      }, 5000);
    });

    await rabbitmq.publish('user_info_get', { user_id: order.user_id, correlationId });

    const userInfo = await dataPromise;

    return {
      order_id: order.id,
      total_price: order.total_price,
      discount_amount: order.discount_amount ?? 0,
      final_price: order.final_price,
      user: userInfo,
      status: order.status,
      shipping_address: order.shipping_address,
      created_at: order.created_at,
      items: items.map(it => ({
        product_id: it.product_id,
        product_name: it.product_name ?? null,
        quantity: it.quantity,
        price: it.price
      }))
    };
  },

  async cancelOrder(orderId, reason = null) {
    const order = await OrderRepository.findByIdWithItems(orderId);
    if (!order) throw new Error('Order not found', 404);

    if (order.status === 'cancelled') {
      return {
        order_id: order.id,
        status: order.status,
        cancelled_at: order.cancelled_at
      };
    }

    // Hoan lai coupon
    if (order.coupon_code && order.status === 'pending') {
      await CouponRepository.increaseQuantity(
        order.coupon_code
      );
    }
    // Doi trang thai sang cancel
    await OrderRepository.updateStatus(
      null,
      orderId,
      'cancelled',
      {
        cancelled_at: new Date(),
        cancel_reason: reason
      }
    );
    // Gui su kien restore de hoan lai so luong san pham
    await rabbitmq.publish('restore_stock', {
      order_id: orderId,
      items: order.items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity
      }))
    });

    return {
      order_id: orderId,
      status: 'cancelled',
      cancelled_at: new Date()
    };
  },


  async setOrderShipping(orderId) {
    const order = await OrderRepository.updateStatus(null, orderId, 'shipping');
    if (!order) throw new Error('Order not found');

    return {
      order_id: order.id,
      status: order.status
    };
  },

  async setOrderCompleted(orderId) {
    const order = await OrderRepository.updateStatus(null, orderId, 'completed');
    if (!order) throw new Error('Order not found');

    return {
      order_id: order.id,
      status: order.status,
      completed_at: order.completed_at
    };
  },

  async setOrderConfirmed(orderId) {
    const order = await OrderRepository.updateStatus(null, orderId, 'confirmed');
    if (!order) throw new Error('Order not found');

    return {
      order_id: order.id,
      status: order.status,
      updated_at: order.updated_at
    };
  },


  async listUserOrders(userId, { page = 1, limit = 10, status = null } = {}) {
    const { rows, total } = await OrderRepository.findByUser(userId, {
      page,
      limit,
      status
    });

    const orders = await Promise.all(
      rows.map(async order => {
        const items = await OrderItemRepository.findByOrder(order.id);

        return {
          order_id: order.id,
          total_price: order.total_price,
          discount_amount: order.discount_amount ?? 0,
          final_price:
            order.final_price ??
            (order.total_price - (order.discount_amount || 0)),
          status: order.status,
          created_at: order.created_at,
          shipping_address: order.shipping_address,
          items: items.map(it => ({
            product_id: it.product_id,
            product_name: it.product_name ?? null,
            quantity: it.quantity,
            price: it.price
          }))
        };
      })
    );

    return { orders, total };
  },

  async getOrderDetail(orderId) {
    const order = await OrderRepository.findById(orderId);
    if (!order) return null;

    const items = await OrderItemRepository.findByOrder(orderId);

    // Lấy thông tin của user có order này
    const correlationId = crypto.randomUUID();
    const dataPromise = new Promise((resolve, reject) => {
      promiseMap.set(correlationId, resolve);
      setTimeout(() => {
        if (promiseMap.has(correlationId)) {
          promiseMap.delete(correlationId);
          reject(new Error("Product service timeout", 504));
        }
      }, 5000);
    });

    await rabbitmq.publish('user_info_get', { user_id: order.user_id, correlationId });

    const userInfo = await dataPromise;

    return {
      order_id: order.id,
      items: items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name ?? null,
        quantity: i.quantity,
        price: i.price
      })),
      user: userInfo,
      total_price: order.total_price,
      discount_amount: order.discount_amount ?? 0,
      final_price:
        order.final_price ??
        (order.total_price - (order.discount_amount || 0)),
      status: order.status,
      shipping_address: order.shipping_address,
    };
  },

  async listAllOrders({ page = null, limit = null } = {}) {
    const { rows, total } = await OrderRepository.findAll({ page, limit });

    const orders = await Promise.all(
      rows.map(async order => {
        const items = await OrderItemRepository.findByOrder(order.id);

        return {
          order_id: order.id,
          total_price: order.total_price,
          discount_amount: order.discount_amount ?? 0,
          final_price:
            order.final_price ??
            (order.total_price - (order.discount_amount || 0)),
          status: order.status,
          created_at: order.created_at,
          shipping_address: order.shipping_address,
          items: items.map(it => ({
            product_id: it.product_id,
            product_name: it.product_name ?? null,
            quantity: it.quantity,
            price: it.price
          }))
        };
      })
    );

    return { orders, total };
  },

  async setOrderConfirmed(orderId) {
    const order = await OrderRepository.updateStatus(null, orderId, 'confirmed');
    if (!order) throw new Error('Order not found');

    return {
      order_id: order.id,
      status: order.status,
      updated_at: order.updated_at
    };
  },

  async initMessageHandle() {
    await rabbitmq.subscribe('order_status_queue', async (data, rk) => {
      try {
        if (rk !== 'payment_success') return;

        const { order_id } = data;
        if (!order_id) {
          console.warn('[ORDER] payment_success missing order_id', data);
          return;
        }

        await OrderRepository.updateStatus(null, order_id, 'paid', { paid_at: new Date() });
        console.log(`[ORDER] Order ${order_id} marked as PAID`);
      } catch (err) {
        console.error('[ORDER] Failed to handle payment_success', err);
      }
    });

    await rabbitmq.subscribe('check_price_queue', async (data, rk) => {
      try {
        if (rk !== 'price_result') return;
        const { products, correlationId } = data;
        const resolver = promiseMap.get(correlationId);
        if (resolver) {
          resolver(products);
          promiseMap.delete(correlationId);
        }

      } catch (err) {
        console.error('[PRODUCT_PRICE] Failed to handle check price of products', err);
      }
    });

    rabbitmq.subscribe('reserve_stock_queue', async (data, rk) => {
      const { order_id, correlationId, reason } = data;

      if (!correlationId) return;

      const resolver = promiseMap.get(correlationId);
      if (!resolver) return;

      if (rk === 'stock_reserved') {
        resolver({ success: true });
      }

      if (rk === 'stock_failed') {
        resolver({ success: false, reason });
      }

      promiseMap.delete(correlationId);
    });


    await rabbitmq.subscribe('payment_order_amount_queue', async (data, rk) => {
      if (rk !== 'order_amount_get') return;
      const { order_id, correlationId } = data;
      // console.log(data);
      const order = await OrderRepository.findById(order_id);
      if (!order) {
        await rabbitmq.publish('order_amount_result', {
          amount: null,
          correlationId
        });
      }

      const amount = order.final_price;
      await rabbitmq.publish('order_amount_result', {
        amount,
        correlationId
      });
    });

    rabbitmq.subscribe('user_info_queue', async (data, rk) => {
      if (rk !== 'user_info_result') return;

      const { correlationId, user } = data;

      const resolver = promiseMap.get(correlationId);
      if (resolver) {
        resolver(user);
        promiseMap.delete(correlationId);
      }
    });

    rabbitmq.subscribe('validate_warranty_queue', async (data, rk) => {
      if (rk !== 'validate_warranty') return;

      const { correlationId, order_id, product_id } = data;

      try {
        if (!correlationId || !order_id || !product_id) {
          return rabbitmq.publish('warranty_result', {
            correlationId,
            valid: false,
            reason: 'INVALID_REQUEST'
          });
        }

        // 1. Get order
        const order = await OrderRepository.findById(order_id);

        if (!order) {
          return rabbitmq.publish('warranty_result', {
            correlationId,
            valid: false,
            reason: 'ORDER_NOT_FOUND'
          });
        }

        // 2. Check payment status
        if (!['paid', 'completed'].includes(order.status)) {
          return rabbitmq.publish('warranty_result', {
            correlationId,
            valid: false,
            reason: 'ORDER_NOT_PAID_YET'
          });
        }

        // 3. Get order items
        const items = await OrderItemRepository.findByOrder(order_id);

        const productExist = items.some(i => i.product_id === product_id);

        if (!productExist) {
          return rabbitmq.publish('warranty_result', {
            correlationId,
            valid: false,
            reason: 'PRODUCT_NOT_IN_ORDER'
          });
        }

        // 4. valid
        rabbitmq.publish('warranty_result', {
          correlationId,
          valid: true
        });

      } catch (err) {
        console.error('VALIDATE WARRANTY ERROR:', err);

        rabbitmq.publish('warranty_result', {
          correlationId,
          valid: false,
          reason: 'SERVER_ERROR'
        });
      }
    });
  }
}
module.exports = OrderService;
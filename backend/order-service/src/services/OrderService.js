const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const rabbitmq = require('../config/rabbitmq');
const crypto = require('crypto');

const OrderRepository = require('../repositories/OrderRepository');
const OrderItemRepository = require('../repositories/OrderItemRepository');
const CouponRepository = require('../repositories/CouponRepository');

const promiseMap = new Map();

const OrderService = {

  async createOrder(
    userId,
    { items = [], coupon_code = null, shipping_address = null }
  ) {
    if (!items.length) throw new Error('items required');

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Calculate total price
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

      const productId = items.map((it) => it.product_id);
      await rabbitmq.publish('check_price', {
        product_id: productId,
        correlationId
      });

      const products = await dataPromise;
      const productMap = new Map(products.map(p => [p.id, p]));

      let totalPrice = 0;

      const mergedItems = items.map(it => {
        const p = productMap.get(it.product_id);

        if (!p || !p.exists) {
          throw new Error(`Product ${it.product_id} not found`, 404);
        }

        if (it.quantity > p.stock) {
          throw new Error(
            `Product ${it.product_id} out of stock (available: ${p.stock})`,
            400
          );
        }

        const itemTotal = p.price * it.quantity;
        totalPrice += itemTotal;

        return {
          product_id: it.product_id,
          quantity: it.quantity,
          price: p.price,
          stock: p.stock,
          name: p.name,
          product_name: p.name,
          total: itemTotal
        };
      });
      // Coupon
      let discountAmount = 0;
      let appliedCoupon = null;
      if (coupon_code) {
        try {
          const coupon = await CouponRepository.findByCode(conn, coupon_code);

          if (coupon) {
            const now = new Date();
            let isValid = true;

            if (coupon.start_at && new Date(coupon.start_at) > now) {
              isValid = false;
            }

            if (coupon.end_at && new Date(coupon.end_at) < now) {
              isValid = false;
            }

            if (coupon.quantity !== null && Number(coupon.quantity) <= 0) {
              isValid = false;
            }

            if (coupon.min_order_value && Number(totalPrice) < Number(coupon.min_order_value)) {
              isValid = false;
            }

            if (isValid) {
              if (coupon.discount_type === 'PERCENT') {
                const rawDiscount = Math.floor(
                  (Number(coupon.discount_value) / 100) * totalPrice
                );

                if (coupon.max_discount) {
                  discountAmount = Math.min(rawDiscount, Number(coupon.max_discount));
                } else {
                  discountAmount = rawDiscount;
                }

              } else if (coupon.discount_type === 'FIXED') {
                discountAmount = Number(coupon.discount_value);
              }
              discountAmount = Math.min(discountAmount, totalPrice);

              if (discountAmount > 0) {
                appliedCoupon = {
                  id: coupon.id,
                  code: coupon.code,
                  discount_type: coupon.discount_type,
                  discount_value: coupon.discount_value,
                  discount_amount: discountAmount
                };
                await CouponRepository.decreaseQuantity(conn, coupon.id);
              }
            }

          }
        } catch (err) {
          console.warn(
            '[COUPON] apply failed, continue without coupon:',
            err.message
          );

          discountAmount = 0;
          appliedCoupon = null;
        }
      }


      const finalPrice = Math.max(0, totalPrice - discountAmount);
      const now = new Date();
      const orderId = `${uuidv4()}`;
      // Create order
      const order = await OrderRepository.create(conn, {
        id: orderId,
        user_id: userId,
        status: 'pending',
        total_price: totalPrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        created_at: now,
        updated_at: now,
        shipping_address: shipping_address || null
      });
      // Trừ stock bên product
      rabbitmq.publish('reserve_stock', {
        order_id: orderId,
        items: mergedItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
        }))
      });
      // Create order items
      const orderItems = mergedItems.map(it => ({
        id: `${uuidv4()}`,
        order_id: orderId,
        product_id: it.product_id,
        quantity: it.quantity,
        price: it.price,
        product_name: it.name
      }));

      if (orderItems.length) {
        await OrderItemRepository.bulkCreate(conn, orderItems);
      }

      await conn.commit();

      return {
        order_id: orderId,
        user_id: userId,
        total_price: totalPrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        status: 'pending',
        coupon: appliedCoupon,
        created_at: now.toISOString()
      };

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getOrderById(orderId) {
    if (!orderId) return null;

    const order = await OrderRepository.findById(orderId);
    if (!order) return null;

    const items = await OrderItemRepository.findByOrder(orderId);

    return {
      order_id: order.id,
      total_price: order.total_price,
      discount_amount: order.discount_amount ?? 0,
      final_price: order.final_price,
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
    return {
      order_id: order.id,
      items: items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name ?? null,
        quantity: i.quantity,
        price: i.price
      })),
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

    await rabbitmq.subscribe('reserve_stock_queue', async (data, rk) => {
      const { order_id, reason } = data;

      if (rk === 'stock_reserved') {
        await OrderRepository.updateStatus(
          pool,
          order_id,
          'confirmed'
        );
      }

      if (rk === 'stock_failed') {
        await OrderRepository.updateStatus(
          pool,
          order_id,
          'cancelled'
        );
      }
    });

    await rabbitmq.subscribe('payment_order_amount_queue', async (data, rk) => {
      if(rk !== 'order_amount_get') return;
      const {order_id, correlationId} = data;
      const order = await OrderRepository.findById(order_id);
      if(!order) {
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
    })
  }

};

module.exports = OrderService;
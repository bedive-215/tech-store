export const RMQ_QUEUES = {
  WISHLIST: 'wishlist_product_queue',
  PRODUCT: 'product_queue',
  ORDER: 'order_status_queue',
  PRODUCT_PRICE: 'check_price_queue',
  RESERVE_STOCK: 'reserve_stock_queue',
  PAYMENT: 'payment_order_amount_queue'
};

export const RMQ_ROUTING_KEYS = {
  WISHLIST: ['wishlist_product', 'product_detail'],
  PRODUCT: ['change_stock', 'change_price', 'change_name'],
  ORDER: ['payment_success'],
  PRODUCT_PRICE: ['check_price', 'price_result'],
  RESERVE_STOCK: ['reserve_stock', 'stock_failed', 'stock_reserved', 'restore_stock'],
  PAYMENT: ['order_amount_result', 'order_amount_get']
};

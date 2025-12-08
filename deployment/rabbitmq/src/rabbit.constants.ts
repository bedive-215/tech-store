export const RMQ_QUEUES = {
  WISHLIST: 'wishlist_product_queue',
  PRODUCT: 'product_queue'
};

export const RMQ_ROUTING_KEYS = {
  WISHLIST: ['wishlist_product', 'product_detail'],
  PRODUCT: ['change_stock', 'change_price', 'change_name']
};

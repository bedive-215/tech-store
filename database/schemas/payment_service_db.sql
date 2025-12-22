CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  txn_ref VARCHAR(64) DEFAULT NULL UNIQUE,
  amount BIGINT NOT NULL,
  currency VARCHAR(8) DEFAULT 'VND',
  status ENUM('pending', 'success', 'failed', 'refunded')NOT NULL DEFAULT 'pending',
  platform ENUM('web', 'app') NOT NULL DEFAULT 'web',
  transaction_id VARCHAR(128),
  metadata JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

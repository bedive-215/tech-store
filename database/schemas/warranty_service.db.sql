CREATE TABLE IF NOT EXISTS warranty (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) NOT NULL,
    url TEXT DEFAULT NULL,
    product_id VARCHAR(36) NOT NULL,
    serial VARCHAR(50) DEFAULT NULL,
    issue_description TEXT NOT NULL,
    status ENUM('pending', 'approved', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    INDEX idx_status (status)
);

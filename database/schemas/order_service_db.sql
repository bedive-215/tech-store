-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    status ENUM('pending','paid','shipping','completed','cancelled', 'confirmed') NOT NULL DEFAULT 'pending',
    total_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    final_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    shipping_address TEXT,
    cancelled_at DATETIME,
    paid_at DATETIME NULL AFTER status,
    cancel_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    discount_type ENUM('PERCENT', 'FIXED') NOT NULL,
    -- Giá trị giảm:
    --  PERCENT  -> 10 (tức 10%)
    --  FIXED    -> 50000 (tức 50.000đ)
    discount_value INT NOT NULL,
    max_discount INT NULL,
    min_order_value INT DEFAULT 0,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_dates (start_at, end_at),
    INDEX idx_type (discount_type)
);

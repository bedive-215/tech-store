
-- SQL Schema for Tech E-commerce Platform

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('user','admin'),
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE brands (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(255)
);

CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(255)
);

CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    brand_id VARCHAR(36),
    category_id VARCHAR(36),
    description TEXT,
    price DECIMAL(10,2),
    stock INT,
    rating_avg DECIMAL(3,2),
    total_reviews INT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_media (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36),
    url VARCHAR(500),
    type ENUM('image','video'),
    created_at DATETIME,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    product_id VARCHAR(36),
    rating INT,
    comment TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE wishlist (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    product_id VARCHAR(36),
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    status ENUM('pending','paid','shipping','completed','cancelled'),
    total_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36),
    product_id VARCHAR(36),
    quantity INT,
    price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36),
    method ENUM('card','wallet','cod'),
    status ENUM('success','failed','pending'),
    transaction_id VARCHAR(255),
    created_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(255),
    discount_percent INT,
    start_at DATETIME,
    end_at DATETIME,
    quantity INT
);

CREATE TABLE flash_sales (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    start_at DATETIME,
    end_at DATETIME
);

CREATE TABLE flash_sale_items (
    id VARCHAR(36) PRIMARY KEY,
    flash_sale_id VARCHAR(36),
    product_id VARCHAR(36),
    sale_price DECIMAL(10,2),
    FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    admin_id VARCHAR(36),
    message TEXT,
    sender ENUM('user','admin'),
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

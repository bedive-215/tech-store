CREATE TABLE brands (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(500) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    total_reviews INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE product_media (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    url VARCHAR(500) NOT NULL,
    type ENUM('image','video') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_media_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE flash_sales (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL
);

CREATE TABLE flash_sale_items (
    id VARCHAR(36) PRIMARY KEY,
    flash_sale_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_flash_sale_items_flash_sale FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_flash_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

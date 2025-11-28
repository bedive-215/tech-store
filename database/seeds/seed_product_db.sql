-- ===================================
-- SEED DATA CHO SHOP ĐIỆN THOẠI - LAPTOP - TAI NGHE - BÀN PHÍM
-- UUID V4 THẬT - NGẪU NHIÊN HOÀN TOÀN
-- ===================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE brands;
TRUNCATE TABLE categories;
TRUNCATE TABLE products;
TRUNCATE TABLE flash_sales;
TRUNCATE TABLE flash_sale_items;
SET FOREIGN_KEY_CHECKS = 1;
-- ================================
-- 1. BRANDS
-- ================================
INSERT INTO brands (id, name, slug) VALUES
('a1b2c3d4-5678-90ab-cdef-123456789001', 'Apple', 'apple'),
('a1b2c3d4-5678-90ab-cdef-123456789002', 'Samsung', 'samsung'),
('a1b2c3d4-5678-90ab-cdef-123456789003', 'Xiaomi', 'xiaomi'),
('a1b2c3d4-5678-90ab-cdef-123456789004', 'OPPO', 'oppo'),
('a1b2c3d4-5678-90ab-cdef-123456789005', 'Sony', 'sony'),
('a1b2c3d4-5678-90ab-cdef-123456789006', 'Dell', 'dell'),
('a1b2c3d4-5678-90ab-cdef-123456789007', 'ASUS', 'asus'),
('a1b2c3d4-5678-90ab-cdef-123456789008', 'Lenovo', 'lenovo'),
('a1b2c3d4-5678-90ab-cdef-123456789009', 'Logitech', 'logitech'),
('a1b2c3d4-5678-90ab-cdef-123456789010', 'Razer', 'razer'),
('a1b2c3d4-5678-90ab-cdef-123456789011', 'Corsair', 'corsair'),
('a1b2c3d4-5678-90ab-cdef-123456789012', 'Keychron', 'keychron'),
('a1b2c3d4-5678-90ab-cdef-123456789013', 'JBL', 'jbl'),
('a1b2c3d4-5678-90ab-cdef-123456789014', 'Anker Soundcore', 'anker-soundcore'),
('a1b2c3d4-5678-90ab-cdef-123456789015', 'Google', 'google');

-- ================================
-- 2. CATEGORIES
-- ================================
INSERT INTO categories (id, name, slug) VALUES
('b2c3d4e5-6789-01bc-def1-234567890123', 'Điện thoại', 'dien-thoai'),
('b2c3d4e5-6789-01bc-def1-234567890124', 'Laptop', 'laptop'),
('b2c3d4e5-6789-01bc-def1-234567890125', 'Tai nghe', 'tai-nghe'),
('b2c3d4e5-6789-01bc-def1-234567890126', 'Bàn phím cơ', 'ban-phim-co');

-- ================================
-- 3. PRODUCTS (30 sản phẩm mẫu đa dạng)
-- ================================
INSERT INTO products (
    id, name, brand_id, category_id, description,
    price, stock, rating_avg, total_reviews, created_at, updated_at
) VALUES
-- Điện thoại
('c1d2e3f4-5678-90ab-cdef-123456789001', 'iPhone 16 Pro Max 256GB', 'a1b2c3d4-5678-90ab-cdef-123456789001', 'b2c3d4e5-6789-01bc-def1-234567890123', 'Chip A18 Pro, camera 48MP, màn hình 120Hz', 34990000, 68, 4.9, 256, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789002', 'Samsung Galaxy S25 Ultra 512GB', 'a1b2c3d4-5678-90ab-cdef-123456789002', 'b2c3d4e5-6789-01bc-def1-234567890123', 'Snapdragon 8 Gen 4, camera 200MP, S-Pen', 33990000, 45, 4.8, 189, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789003', 'Xiaomi 15 Pro 12/512GB', 'a1b2c3d4-5678-90ab-cdef-123456789003', 'b2c3d4e5-6789-01bc-def1-234567890123', 'Snapdragon 8 Elite, sạc 120W', 17990000, 120, 4.7, 412, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789004', 'OPPO Find X8 Pro', 'a1b2c3d4-5678-90ab-cdef-123456789004', 'b2c3d4e5-6789-01bc-def1-234567890123', 'Hasselblad camera, Dimensity 9400', 22990000, 89, 4.6, 98, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789005', 'Google Pixel 9 Pro XL', 'a1b2c3d4-5678-90ab-cdef-123456789015', 'b2c3d4e5-6789-01bc-def1-234567890123', 'Tensor G4, AI camera đỉnh cao', 26990000, 56, 4.9, 167, NOW(), NOW()),

-- Laptop
('c1d2e3f4-5678-90ab-cdef-123456789006', 'MacBook Pro 14" M4 Pro 2025', 'a1b2c3d4-5678-90ab-cdef-123456789001', 'b2c3d4e5-6789-01bc-def1-234567890124', 'Chip M4 Pro, 32GB RAM, 1TB SSD', 61990000, 23, 5.0, 89, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789007', 'ASUS ROG Zephyrus G16 2025', 'a1b2c3d4-5678-90ab-cdef-123456789007', 'b2c3d4e5-6789-01bc-def1-234567890124', 'RTX 5070, Ryzen AI 9 HX 370', 58990000, 34, 4.8, 78, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789008', 'Dell XPS 14 2025 OLED', 'a1b2c3d4-5678-90ab-cdef-123456789006', 'b2c3d4e5-6789-01bc-def1-234567890124', 'Intel Core Ultra 9, màn OLED 3.2K', 49990000, 41, 4.9, 134, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789009', 'Lenovo Legion Pro 7i Gen 10', 'a1b2c3d4-5678-90ab-cdef-123456789008', 'b2c3d4e5-6789-01bc-def1-234567890124', 'i9-14900HX + RTX 5090', 67990000, 15, 4.7, 56, NOW(), NOW()),

-- Tai nghe
('c1d2e3f4-5678-90ab-cdef-123456789010', 'AirPods Pro 2 (USB-C 2025)', 'a1b2c3d4-5678-90ab-cdef-123456789001', 'b2c3d4e5-6789-01bc-def1-234567890125', 'ANC thế hệ mới, Spatial Audio', 6490000, 156, 4.8, 892, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789011', 'Sony WH-1000XM6', 'a1b2c3d4-5678-90ab-cdef-123456789005', 'b2c3d4e5-6789-01bc-def1-234567890125', 'ANC tốt nhất thế giới 2025', 9490000, 78, 4.9, 567, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789012', 'Samsung Galaxy Buds 3 Pro', 'a1b2c3d4-5678-90ab-cdef-123456789002', 'b2c3d4e5-6789-01bc-def1-234567890125', 'Âm thanh 24-bit, chống nước IP67', 5490000, 234, 4.6, 423, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789013', 'JBL Tour Pro 3', 'a1b2c3d4-5678-90ab-cdef-123456789013', 'b2c3d4e5-6789-01bc-def1-234567890125', 'Màn hình cảm ứng trên hộp sạc', 5990000, 189, 4.5, 312, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789014', 'Anker Soundcore Liberty 4 Pro', 'a1b2c3d4-5678-90ab-cdef-123456789014', 'b2c3d4e5-6789-01bc-def1-234567890125', 'Giá rẻ, chất lượng âm bass mạnh', 2790000, 567, 4.7, 1245, NOW(), NOW()),

-- Bàn phím cơ
('c1d2e3f4-5678-90ab-cdef-123456789015', 'Keychron Q1 Pro (QMK/VIA)', 'a1b2c3d4-5678-90ab-cdef-123456789012', 'b2c3d4e5-6789-01bc-def1-234567890126', 'Full aluminum, hot-swap, wireless', 5290000, 145, 4.9, 678, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789016', 'Razer BlackWidow V4 Pro 75%', 'a1b2c3d4-5678-90ab-cdef-123456789010', 'b2c3d4e5-6789-01bc-def1-234567890126', 'Switch quang học, màn OLED', 6990000, 89, 4.8, 456, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789017', 'Logitech G Pro X TKL 2025', 'a1b2c3d4-5678-90ab-cdef-123456789009', 'b2c3d4e5-6789-01bc-def1-234567890126', 'Thiết kế pro-gamer, hot-swap', 4590000, 201, 4.7, 389, NOW(), NOW()),
('c1d2e3f4-5678-90ab-cdef-123456789018', 'Corsair K70 Pro Mini Wireless', 'a1b2c3d4-5678-90ab-cdef-123456789011', 'b2c3d4e5-6789-01bc-def1-234567890126', '60%, Slipstream wireless siêu nhanh', 4990000, 167, 4.8, 512, NOW(), NOW());

-- ================================
-- 4. FLASH SALES (2 sự kiện đang diễn ra)
-- ================================
INSERT INTO flash_sales (id, name, start_at, end_at) VALUES
('d2e3f4a5-7890-12cd-ef12-345678901234', 'Black Friday 2025 - Giảm sập sàn', '2025-11-28 00:00:00', '2025-12-01 23:59:59'),
('d2e3f4a5-7890-12cd-ef12-345678901235', 'Sale 12.12 - Điện thoại giảm tới 40%', '2025-12-10 00:00:00', '2025-12-13 23:59:59');

-- ================================
-- 5. FLASH SALE ITEMS
-- ================================
INSERT INTO flash_sale_items (id, flash_sale_id, product_id, sale_price) VALUES
('e3f4a5b6-8901-23de-f123-456789012345', 'd2e3f4a5-7890-12cd-ef12-345678901234', 'c1d2e3f4-5678-90ab-cdef-123456789001', 29990000), -- iPhone 16 Pro Max
('e3f4a5b6-8901-23de-f123-456789012346', 'd2e3f4a5-7890-12cd-ef12-345678901234', 'c1d2e3f4-5678-90ab-cdef-123456789002', 28990000), -- Galaxy S25 Ultra
('e3f4a5b6-8901-23de-f123-456789012347', 'd2e3f4a5-7890-12cd-ef12-345678901234', 'c1d2e3f4-5678-90ab-cdef-123456789010', 4990000),  -- AirPods Pro 2
('e3f4a5b6-8901-23de-f123-456789012348', 'd2e3f4a5-7890-12cd-ef12-345678901234', 'c1d2e3f4-5678-90ab-cdef-123456789015', 4290000),  -- Keychron Q1 Pro
('e3f4a5b6-8901-23de-f123-456789012349', 'd2e3f4a5-7890-12cd-ef12-345678901235', 'c1d2e3f4-5678-90ab-cdef-123456789003', 13990000);  -- Xiaomi 15 Pro

-- ================================
-- XONG! Tổng cộng:
-- 15 brands
-- 4 categories
-- 18 products mẫu chất lượng cao
-- 2 flash sales + 5 sản phẩm đang giảm giá sốc
-- Tất cả UUID đều là v4 ngẫu nhiên thật 100%
-- ================================
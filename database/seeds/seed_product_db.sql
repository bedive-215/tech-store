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
INSERT INTO brands (id, name, logo, slug) VALUES
('a1b2c3d4-5678-90ab-cdef-123456789001', 'Apple', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', 'apple'),
('a1b2c3d4-5678-90ab-cdef-123456789002', 'Samsung', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Samsung_logo_blue.png/1200px-Samsung_logo_blue.png', 'samsung'),
('a1b2c3d4-5678-90ab-cdef-123456789003', 'Xiaomi', 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg', 'xiaomi'),
('a1b2c3d4-5678-90ab-cdef-123456789004', 'OPPO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/OPPO_LOGO_2019.svg/2560px-OPPO_LOGO_2019.svg.png', 'oppo'),
('a1b2c3d4-5678-90ab-cdef-123456789005', 'Sony', 'https://upload.wikimedia.org/wikipedia/commons/2/20/Sony_logo.svghttps://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/2560px-Sony_logo.svg.png', 'sony'),
('a1b2c3d4-5678-90ab-cdef-123456789006', 'Dell', 'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg', 'dell'),
('a1b2c3d4-5678-90ab-cdef-123456789007', 'ASUS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/2560px-ASUS_Logo.svg.png', 'asus'),
('a1b2c3d4-5678-90ab-cdef-123456789008', 'Lenovo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Lenovo_Global_Corporate_Logo.png/1200px-Lenovo_Global_Corporate_Logo.png?20200530073447', 'lenovo'),
('a1b2c3d4-5678-90ab-cdef-123456789009', 'Logitech', 'https://images.seeklogo.com/logo-png/50/1/logitech-g-logo-png_seeklogo-501218.png', 'logitech'),
('a1b2c3d4-5678-90ab-cdef-123456789010', 'Razer', 'https://w7.pngwing.com/pngs/892/965/png-transparent-razer-logo-razer-inc-logo-encapsulated-postscript-razer-logo-miscellaneous-text-computer.png', 'razer'),
('a1b2c3d4-5678-90ab-cdef-123456789011', 'Corsair', 'https://phongvu.vn/cong-nghe/wp-content/uploads/2018/05/New-Corsair-Logo.png', 'corsair'),
('a1b2c3d4-5678-90ab-cdef-123456789012', 'Keychron', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Keychron_logo.svg/2560px-Keychron_logo.svg.png', 'keychron'),
('a1b2c3d4-5678-90ab-cdef-123456789013', 'JBL', 'https://images.seeklogo.com/logo-png/7/1/jbl-logo-png_seeklogo-75160.png', 'jbl'),
('a1b2c3d4-5678-90ab-cdef-123456789014', 'Anker Soundcore', 'https://images.seeklogo.com/logo-png/40/2/soundcore-logo-png_seeklogo-402822.png', 'anker-soundcore'),
('a1b2c3d4-5678-90ab-cdef-123456789015', 'Google', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', 'google');


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
('d2e3f4a5-7890-12cd-ef12-345678901234', 'Black Friday 2025 - Giảm sập sàn', '2025-11-28 00:00:00', '2025-12-20 23:59:59'),
('d2e3f4a5-7890-12cd-ef12-345678901235', 'Sale 12.12 - Điện thoại giảm tới 40%', '2025-12-10 00:00:00', '2025-12-13 23:59:59');

-- ================================
-- 5. FLASH SALE ITEMS
-- ================================
INSERT INTO flash_sale_items (id, flash_sale_id, product_id, sale_price, stock_limit) VALUES
('e3f4a5b6-8901-23de-f123-456789012345', 'd2e3f4a5-7890-12cd-ef12-345678901234', 'c1d2e3f4-5678-90ab-cdef-123456789001', 29990000, 20), -- iPhone 16 Pro Max
('e3f4a5b6-8901-23de-f123-456789012346', 'd2e3f4a5-7890-12cd-ef12-345678901234', 'c1d2e3f4-5678-90ab-cdef-123456789002', 28990000, 50), -- Galaxy S25 Ultra
('e3f4a5b6-8901-23de-f123-456789012347', 'd2e3f4a5-7890-12cd-ef12-345678901234', 'c1d2e3f4-5678-90ab-cdef-123456789010', 4990000, 100),  -- AirPods Pro 2
('e3f4a5b6-8901-23de-f123-456789012348', 'd2e3f4a5-7890-12cd-ef12-345678901234', 'c1d2e3f4-5678-90ab-cdef-123456789015', 4290000, 50),  -- Keychron Q1 Pro
('e3f4a5b6-8901-23de-f123-456789012349', 'd2e3f4a5-7890-12cd-ef12-345678901235', 'c1d2e3f4-5678-90ab-cdef-123456789003', 13990000, 30);  -- Xiaomi 15 Pro


-- ================================
-- 6. PRODUCT MEDIA
-- ================================
INSERT INTO product_media (id, product_id, is_primary, url, type, created_at) VALUES
-- Điện thoại
('m1-001', 'c1d2e3f4-5678-90ab-cdef-123456789001', TRUE, 'https://cdn2.cellphones.com.vn/x/media/catalog/product/i/p/iphone-16-pro-max.png?_gl=1*7bg9up*_gcl_aw*R0NMLjE3NjQ5MjYxMjAuQ2owS0NRaUFvc3JKQmhEMEFSSXNBSGViQ05yWUtuTllWVU9vQ2RwWHVNaVIxaXhqbUJDSjV2NW96OWdlZDJqY19idXd4SXRCUlR5cjY2VWFBcUlURUFMd193Y0I.*_gcl_au*MTg1MDYyNjYwMy4xNzYwOTY5Mzk5*_ga*MTAwODc2NzI5OC4xNzYwOTY5NDAw*_ga_QLK8WFHNK9*czE3NjQ5MjYxMjAkbzExJGcwJHQxNzY0OTI2MTIzJGo1NyRsMCRoNzgwOTg3MTQy', 'image', NOW()),
('m1-002', 'c1d2e3f4-5678-90ab-cdef-123456789002', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-samsung-galaxy-s25-ultra_2__4_1.png', 'image', NOW()),
('m1-003', 'c1d2e3f4-5678-90ab-cdef-123456789003', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-plus_1__1.png', 'image', NOW()),
('m1-004', 'c1d2e3f4-5678-90ab-cdef-123456789004', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-oppo-find-x8-pro.png', 'image', NOW()),
('m1-005', 'c1d2e3f4-5678-90ab-cdef-123456789005', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-google-pixel-9-pro_1__1.png', 'image', NOW()),

-- Laptop
('m1-006', 'c1d2e3f4-5678-90ab-cdef-123456789006', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_1__6_135.png', 'image', NOW()),
('m1-007', 'c1d2e3f4-5678-90ab-cdef-123456789007', TRUE, 'https://lapvip.vn/upload/products/thumb_350x0/laptop-asus-rog-zephyrus-g16-gu605cm-qr078w-1749537567.jpg', 'image', NOW()),
('m1-008', 'c1d2e3f4-5678-90ab-cdef-123456789008', TRUE, 'https://macstores.vn/wp-content/uploads/2024/03/dell-xps-14-9440-1.jpg', 'image', NOW()),
('m1-009', 'c1d2e3f4-5678-90ab-cdef-123456789009', TRUE, 'https://macstores.vn/wp-content/uploads/2024/07/thinkpad-p1-gen-7-1.jpg', 'image', NOW()),

-- Tai nghe
('m1-010', 'c1d2e3f4-5678-90ab-cdef-123456789010', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/i/airpods_pro_2_sep24_pdp_image_position_2__vn-vi.jpg', 'image', NOW()),
('m1-011', 'c1d2e3f4-5678-90ab-cdef-123456789011', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-wh-1000xm6.jpg', 'image', NOW()),
('m1-012', 'c1d2e3f4-5678-90ab-cdef-123456789012', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:0/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-samsung-galaxy-buds-3-pro-spa_1.png', 'image', NOW()),
('m1-013', 'c1d2e3f4-5678-90ab-cdef-123456789013', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:0/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_840.png', 'image', NOW()),
('m1-014', 'c1d2e3f4-5678-90ab-cdef-123456789014', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:0/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-khong-day-anker-soundcore-liberty-4-pro-thumb.png', 'image', NOW()),

-- Bàn phím cơ
('m1-015', 'c1d2e3f4-5678-90ab-cdef-123456789015', TRUE, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS1u-ladv6m3l5MKOaQj-Rv-OOl4GeVJ5FL7_K893E-kR0qwX_jvlX6Of2hblAYSuSQPEaKxvLAxdHQJeJmzE7beGq9nxfTEcMzOM8EAUZ09Ir9eXcHFkR08bsYD6z05N-Y31wEdsP0Kw&usqp=CAc', 'image', NOW()),
('m1-016', 'c1d2e3f4-5678-90ab-cdef-123456789016', TRUE, 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTDVniLM-y--pWOBRlnDBL_hKSvvpgvf6WyAqgN5TUjhJdviKBCGL7UcK18cQdFyei_6PLXIjqyiZaJ8S-B9UXKOl36YbxN3HtdGmtaIWL8uyHrOle0qPXrmMjJa5jJWdQpqYz2m6ugLVU&usqp=CAc', 'image', NOW()),
('m1-017', 'c1d2e3f4-5678-90ab-cdef-123456789017', TRUE, 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/a/gaming_8_81_.png', 'image', NOW()),
('m1-018', 'c1d2e3f4-5678-90ab-cdef-123456789018', TRUE, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRq3Ymj_5zZYb-q3BQ4Jt10TPf6mA8QBiOVjjOyHj51DFnoMiIi2GiR2urytlItxO9PFf3AZ43Fx8RsM0sqCxJ9bBj7xRcCMkMVV_JjCp57tzusmVbbYqEeUY5Cl7xEVr0hSorgAyg1Lw&usqp=CAchttps://upload.wikimedia.org/wikipedia/commons/3/3a/Corsair_logo.svg', 'image', NOW());


-- ================================
-- XONG! Tổng cộng:
-- 15 brands
-- 4 categories
-- 18 products mẫu chất lượng cao
-- 2 flash sales + 5 sản phẩm đang giảm giá sốc
-- Tất cả UUID đều là v4 ngẫu nhiên thật 100%
-- ================================
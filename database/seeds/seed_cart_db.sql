-- ===================================
-- SEED DATA FOR CART SERVICE DATABASE
-- ===================================

-- Clear existing data (optional)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE carts;
SET FOREIGN_KEY_CHECKS = 1;

-- ===================================
-- 1. SEED CARTS TABLE
-- ===================================
-- Tạo giỏ hàng cho các user (bao gồm admin để test)
INSERT INTO carts (id, user_id, created_at, updated_at) VALUES
-- Admin cart (để test)
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-03-01 08:00:00', '2024-03-19 15:30:00'),

-- Regular users carts
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '2024-03-05 10:30:00', '2024-03-19 14:20:00'),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '2024-03-07 11:00:00', '2024-03-18 16:45:00'),
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '2024-03-08 14:20:00', '2024-03-19 10:15:00'),
('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '2024-03-09 16:45:00', '2024-03-18 13:30:00'),
('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', '2024-03-10 09:15:00', '2024-03-19 11:00:00'),
('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', '2024-03-11 13:30:00', '2024-03-18 09:45:00'),
('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', '2024-03-12 10:00:00', '2024-03-19 15:20:00'),
('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', '2024-03-13 15:45:00', '2024-03-18 14:10:00'),
('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', '2024-03-14 08:30:00', '2024-03-19 09:30:00');

-- ===================================
-- 2. SEED CART_ITEMS TABLE
-- ===================================
INSERT INTO cart_items (id, cart_id, product_id, product_name, image_url, price, stock, quantity, created_at, updated_at) VALUES

-- Admin cart items (để test - giỏ hàng phong phú)
('950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'c1d2e3f4-5678-90ab-cdef-123456789001', 'iPhone 16 Pro Max 256GB', 'https://cdn2.cellphones.com.vn/x/media/catalog/product/i/p/iphone-16-pro-max.png', 34990000.00, 68, 1, '2024-03-19 10:00:00', '2024-03-19 10:00:00'),
('950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'c1d2e3f4-5678-90ab-cdef-123456789010', 'AirPods Pro 2 (USB-C 2025)', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/i/airpods_pro_2_sep24_pdp_image_position_2__vn-vi.jpg', 6490000.00, 156, 2, '2024-03-19 10:15:00', '2024-03-19 15:30:00'),
('950e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'c1d2e3f4-5678-90ab-cdef-123456789015', 'Keychron Q1 Pro (QMK/VIA)', 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS1u-ladv6m3l5MKOaQj-Rv-OOl4GeVJ5FL7_K893E-kR0qwX_jvlX6Of2hblAYSuSQPEaKxvLAxdHQJeJmzE7beGq9nxfTEcMzOM8EAUZ09Ir9eXcHFkR08bsYD6z05N-Y31wEdsP0Kw&usqp=CAc', 5290000.00, 145, 1, '2024-03-19 14:00:00', '2024-03-19 14:00:00'),

-- User 550e8400-e29b-41d4-a716-446655440003 cart items (Nguyễn Văn An)
('950e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440003', 'c1d2e3f4-5678-90ab-cdef-123456789003', 'Xiaomi 15 Pro 12/512GB', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-plus_1__1.png', 17990000.00, 120, 1, '2024-03-18 11:30:00', '2024-03-18 11:30:00'),
('950e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440003', 'c1d2e3f4-5678-90ab-cdef-123456789014', 'Anker Soundcore Liberty 4 Pro', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:0/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-khong-day-anker-soundcore-liberty-4-pro-thumb.png', 2790000.00, 567, 2, '2024-03-19 14:20:00', '2024-03-19 14:20:00'),

-- User 550e8400-e29b-41d4-a716-446655440004 cart items (Trần Thị Bình)
('950e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440004', 'c1d2e3f4-5678-90ab-cdef-123456789002', 'Samsung Galaxy S25 Ultra 512GB', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-samsung-galaxy-s25-ultra_2__4_1.png', 33990000.00, 45, 1, '2024-03-18 09:00:00', '2024-03-18 09:00:00'),
('950e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440004', 'c1d2e3f4-5678-90ab-cdef-123456789012', 'Samsung Galaxy Buds 3 Pro', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:0/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/a/tai-nghe-samsung-galaxy-buds-3-pro-spa_1.png', 5490000.00, 234, 1, '2024-03-18 16:45:00', '2024-03-18 16:45:00'),

-- User 550e8400-e29b-41d4-a716-446655440005 cart items (Lê Minh Châu)
('950e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440005', 'c1d2e3f4-5678-90ab-cdef-123456789006', 'MacBook Pro 14" M4 Pro 2025', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_1__6_135.png', 61990000.00, 23, 1, '2024-03-19 09:30:00', '2024-03-19 09:30:00'),
('950e8400-e29b-41d4-a716-446655440009', '750e8400-e29b-41d4-a716-446655440005', 'c1d2e3f4-5678-90ab-cdef-123456789011', 'Sony WH-1000XM6', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-wh-1000xm6.jpg', 9490000.00, 78, 1, '2024-03-19 10:15:00', '2024-03-19 10:15:00'),

-- User 550e8400-e29b-41d4-a716-446655440006 cart items (Phạm Văn Dũng)
('950e8400-e29b-41d4-a716-446655440010', '750e8400-e29b-41d4-a716-446655440006', 'c1d2e3f4-5678-90ab-cdef-123456789007', 'ASUS ROG Zephyrus G16 2025', 'https://lapvip.vn/upload/products/thumb_350x0/laptop-asus-rog-zephyrus-g16-gu605cm-qr078w-1749537567.jpg', 58990000.00, 34, 1, '2024-03-18 13:30:00', '2024-03-18 13:30:00'),

-- User 550e8400-e29b-41d4-a716-446655440007 cart items (Hoàng Thị Em)
('950e8400-e29b-41d4-a716-446655440011', '750e8400-e29b-41d4-a716-446655440007', 'c1d2e3f4-5678-90ab-cdef-123456789016', 'Razer BlackWidow V4 Pro 75%', 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTDVniLM-y--pWOBRlnDBL_hKSvvpgvf6WyAqgN5TUjhJdviKBCGL7UcK18cQdFyei_6PLXIjqyiZaJ8S-B9UXKOl36YbxN3HtdGmtaIWL8uyHrOle0qPXrmMjJa5jJWdQpqYz2m6ugLVU&usqp=CAc', 6990000.00, 89, 1, '2024-03-19 10:00:00', '2024-03-19 10:00:00'),
('950e8400-e29b-41d4-a716-446655440012', '750e8400-e29b-41d4-a716-446655440007', 'c1d2e3f4-5678-90ab-cdef-123456789017', 'Logitech G Pro X TKL 2025', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/a/gaming_8_81_.png', 4590000.00, 201, 1, '2024-03-19 11:00:00', '2024-03-19 11:00:00'),

-- User 550e8400-e29b-41d4-a716-446655440008 cart items (Vũ Đình Phong)
('950e8400-e29b-41d4-a716-446655440013', '750e8400-e29b-41d4-a716-446655440008', 'c1d2e3f4-5678-90ab-cdef-123456789004', 'OPPO Find X8 Pro', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-oppo-find-x8-pro.png', 22990000.00, 89, 1, '2024-03-18 09:00:00', '2024-03-18 09:00:00'),
('950e8400-e29b-41d4-a716-446655440014', '750e8400-e29b-41d4-a716-446655440008', 'c1d2e3f4-5678-90ab-cdef-123456789013', 'JBL Tour Pro 3', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:0/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_840.png', 5990000.00, 189, 1, '2024-03-18 09:45:00', '2024-03-18 09:45:00'),

-- User 550e8400-e29b-41d4-a716-446655440009 cart items (Đỗ Thị Giang)
('950e8400-e29b-41d4-a716-446655440015', '750e8400-e29b-41d4-a716-446655440009', 'c1d2e3f4-5678-90ab-cdef-123456789005', 'Google Pixel 9 Pro XL', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-google-pixel-9-pro_1__1.png', 26990000.00, 56, 1, '2024-03-19 14:00:00', '2024-03-19 14:00:00'),
('950e8400-e29b-41d4-a716-446655440016', '750e8400-e29b-41d4-a716-446655440009', 'c1d2e3f4-5678-90ab-cdef-123456789018', 'Corsair K70 Pro Mini Wireless', 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRq3Ymj_5zZYb-q3BQ4Jt10TPf6mA8QBiOVjjOyHj51DFnoMiIi2GiR2urytlItxO9PFf3AZ43Fx8RsM0sqCxJ9bBj7xRcCMkMVV_JjCp57tzusmVbbYqEeUY5Cl7xEVr0hSorgAyg1Lw&usqp=CAc', 4990000.00, 167, 2, '2024-03-19 15:20:00', '2024-03-19 15:20:00'),

-- User 550e8400-e29b-41d4-a716-446655440010 cart items (Bùi Văn Hùng)
('950e8400-e29b-41d4-a716-446655440017', '750e8400-e29b-41d4-a716-446655440010', 'c1d2e3f4-5678-90ab-cdef-123456789008', 'Dell XPS 14 2025 OLED', 'https://macstores.vn/wp-content/uploads/2024/03/dell-xps-14-9440-1.jpg', 49990000.00, 41, 1, '2024-03-18 13:00:00', '2024-03-18 13:00:00'),
('950e8400-e29b-41d4-a716-446655440018', '750e8400-e29b-41d4-a716-446655440010', 'c1d2e3f4-5678-90ab-cdef-123456789010', 'AirPods Pro 2 (USB-C 2025)', 'https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/i/airpods_pro_2_sep24_pdp_image_position_2__vn-vi.jpg', 6490000.00, 156, 1, '2024-03-18 14:10:00', '2024-03-18 14:10:00'),

-- User 550e8400-e29b-41d4-a716-446655440011 cart items (Ngô Thị Lan)
('950e8400-e29b-41d4-a716-446655440019', '750e8400-e29b-41d4-a716-446655440011', 'c1d2e3f4-5678-90ab-cdef-123456789009', 'Lenovo Legion Pro 7i Gen 10', 'https://macstores.vn/wp-content/uploads/2024/07/thinkpad-p1-gen-7-1.jpg', 67990000.00, 15, 1, '2024-03-19 08:30:00', '2024-03-19 08:30:00'),
('950e8400-e29b-41d4-a716-446655440020', '750e8400-e29b-41d4-a716-446655440011', 'c1d2e3f4-5678-90ab-cdef-123456789015', 'Keychron Q1 Pro (QMK/VIA)', 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS1u-ladv6m3l5MKOaQj-Rv-OOl4GeVJ5FL7_K893E-kR0qwX_jvlX6Of2hblAYSuSQPEaKxvLAxdHQJeJmzE7beGq9nxfTEcMzOM8EAUZ09Ir9eXcHFkR08bsYD6z05N-Y31wEdsP0Kw&usqp=CAc', 5290000.00, 145, 1, '2024-03-19 09:30:00', '2024-03-19 09:30:00');

-- ===================================
-- VERIFY DATA
-- ===================================
SELECT 'Carts' AS table_name, COUNT(*) AS total_records FROM carts
UNION ALL
SELECT 'Cart Items', COUNT(*) FROM cart_items;

-- ===================================
-- DETAILED VERIFICATION
-- ===================================
SELECT 
    c.id AS cart_id,
    u.full_name AS user_name,
    u.email,
    COUNT(ci.id) AS items_count,
    SUM(ci.price * ci.quantity) AS total_value
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN (
    SELECT '550e8400-e29b-41d4-a716-446655440001' AS id, 'Admin System' AS full_name, 'admin@tech.com' AS email
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440003', 'Nguyễn Văn An', 'nguyen.van.an@gmail.com'
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440004', 'Trần Thị Bình', 'tran.thi.binh@gmail.com'
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440005', 'Lê Minh Châu', 'le.minh.chau@gmail.com'
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440006', 'Phạm Văn Dũng', 'pham.van.dung@gmail.com'
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440007', 'Hoàng Thị Em', 'hoang.thi.em@gmail.com'
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440008', 'Vũ Đình Phong', 'vu.dinh.phong@gmail.com'
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440009', 'Đỗ Thị Giang', 'do.thi.giang@gmail.com'
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440010', 'Bùi Văn Hùng', 'bui.van.hung@gmail.com'
    UNION ALL SELECT '550e8400-e29b-41d4-a716-446655440011', 'Ngô Thị Lan', 'ngo.thi.lan@gmail.com'
) u ON c.user_id = u.id
GROUP BY c.id, u.full_name, u.email
ORDER BY user_name;

-- ===================================
-- NOTES
-- ===================================
-- Summary:
-- - 10 carts (bao gồm 1 admin cart và 9 regular user carts)
-- - 20 cart_items (phân bố đa dạng các loại sản phẩm)
-- - Admin cart có 3 items để test đầy đủ chức năng
-- - Mỗi user có 1-3 items trong giỏ hàng
-- - Dữ liệu bao gồm đầy đủ: điện thoại, laptop, tai nghe, bàn phím
-- - Tất cả product_id, image_url, price, stock đều khớp với seed_product_db.sql
-- - Giá trị quantity thay đổi để test các trường hợp khác nhau
--
-- Admin cart để test:
-- - User: admin@tech.com (ID: 550e8400-e29b-41d4-a716-446655440001)
-- - Items: iPhone 16 Pro Max (x1), AirPods Pro 2 (x2), Keychron Q1 Pro (x1)
-- - Total value: ~48,260,000 VNĐ
--
-- ===================================
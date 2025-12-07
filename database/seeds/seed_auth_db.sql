-- ===================================
-- SEED DATA FOR AUTH SERVICE DATABASE
-- ===================================

-- Clear existing data (optional)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE chat_messages;
TRUNCATE TABLE wishlist;
TRUNCATE TABLE reviews;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ===================================
-- 1. SEED USERS TABLE
-- ===================================
INSERT INTO users (id, full_name, email, password_hash, role, created_at, updated_at) VALUES
-- Admin accounts
('550e8400-e29b-41d4-a716-446655440001', 'Admin System', 'admin@tech.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'admin', '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('550e8400-e29b-41d4-a716-446655440002', 'Nguyễn Văn Admin', 'admin.nguyen@tech.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'admin', '2024-01-05 09:00:00', '2024-01-05 09:00:00'),

-- Regular users
('550e8400-e29b-41d4-a716-446655440003', 'Nguyễn Văn An', 'nguyen.van.an@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-01-10 10:30:00', '2024-01-10 10:30:00'),
('550e8400-e29b-41d4-a716-446655440004', 'Trần Thị Bình', 'tran.thi.binh@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-01-12 11:00:00', '2024-01-12 11:00:00'),
('550e8400-e29b-41d4-a716-446655440005', 'Lê Minh Châu', 'le.minh.chau@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-01-15 14:20:00', '2024-01-15 14:20:00'),
('550e8400-e29b-41d4-a716-446655440006', 'Phạm Văn Dũng', 'pham.van.dung@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-01-18 16:45:00', '2024-01-18 16:45:00'),
('550e8400-e29b-41d4-a716-446655440007', 'Hoàng Thị Em', 'hoang.thi.em@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-01-20 09:15:00', '2024-01-20 09:15:00'),
('550e8400-e29b-41d4-a716-446655440008', 'Vũ Đình Phong', 'vu.dinh.phong@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-01-22 13:30:00', '2024-01-22 13:30:00'),
('550e8400-e29b-41d4-a716-446655440009', 'Đỗ Thị Giang', 'do.thi.giang@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-01-25 10:00:00', '2024-01-25 10:00:00'),
('550e8400-e29b-41d4-a716-446655440010', 'Bùi Văn Hùng', 'bui.van.hung@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-01-28 15:45:00', '2024-01-28 15:45:00'),
('550e8400-e29b-41d4-a716-446655440011', 'Ngô Thị Lan', 'ngo.thi.lan@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-02-01 08:30:00', '2024-02-01 08:30:00'),
('550e8400-e29b-41d4-a716-446655440012', 'Đinh Văn Khoa', 'dinh.van.khoa@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-02-03 11:20:00', '2024-02-03 11:20:00'),
('550e8400-e29b-41d4-a716-446655440013', 'Trương Thị Mai', 'truong.thi.mai@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-02-05 14:00:00', '2024-02-05 14:00:00'),
('550e8400-e29b-41d4-a716-446655440014', 'Lý Văn Nam', 'ly.van.nam@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-02-08 09:45:00', '2024-02-08 09:45:00'),
('550e8400-e29b-41d4-a716-446655440015', 'Phan Thị Oanh', 'phan.thi.oanh@gmail.com', '$2a$12$kGLXE.s0jqyC54BMMsjfOOONz.MIVAl2UeIBiaijbo26lNSSmhp5O', 'user', '2024-02-10 16:30:00', '2024-02-10 16:30:00');

-- ===================================
-- 2. SEED REVIEWS TABLE
-- ===================================
INSERT INTO reviews (id, user_id, product_id, rating, comment, created_at) VALUES
-- Product P00001 reviews (Sạc nhanh Tesla)
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'P00001', 5, 'Sạc rất nhanh, chất lượng tuyệt vời! Xe Tesla của tôi sạc đầy chỉ trong 30 phút.', '2024-02-15 10:30:00'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'P00001', 4, 'Sản phẩm tốt nhưng giá hơi cao. Công suất mạnh, phù hợp cho xe điện cao cấp.', '2024-02-16 14:20:00'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'P00001', 5, 'Đóng gói cẩn thận, giao hàng nhanh. Sạc hoạt động ổn định không bị nóng.', '2024-02-18 09:15:00'),

-- Product P00002 reviews (Sạc di động VinFast)
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'P00002', 5, 'Tiện lợi mang theo đi xa, sạc khẩn cấp rất hữu ích. Phù hợp với xe VinFast.', '2024-02-17 11:00:00'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'P00002', 4, 'Nhỏ gọn, dễ sử dụng. Tốc độ sạc chậm hơn sạc cố định nhưng chấp nhận được.', '2024-02-19 15:30:00'),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440009', 'P00002', 3, 'Sản phẩm tạm ổn, tốc độ sạc không được nhanh lắm. Giá cả phải chăng.', '2024-02-20 13:45:00'),

-- Product P00003 reviews (Cáp sạc Type 2)
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'P00003', 5, 'Cáp chất lượng cao, bền bỉ. Tương thích với nhiều loại xe điện.', '2024-02-21 10:00:00'),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440010', 'P00003', 4, 'Cáp dài vừa đủ, không bị rối. Giá tốt so với chất lượng.', '2024-02-22 16:20:00'),

-- Product P00004 reviews (Adapter CCS2)
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440011', 'P00004', 5, 'Adapter cần thiết cho xe Châu Âu. Hoạt động hoàn hảo không lỗi.', '2024-02-23 09:30:00'),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440012', 'P00004', 4, 'Sản phẩm đúng mô tả, giao hàng nhanh. Build quality tốt.', '2024-02-24 14:15:00'),

-- Product P00005 reviews (Đế sạc không dây)
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440013', 'P00005', 5, 'Sạc không dây rất tiện, không cần cắm dây. Thiết kế đẹp, sang trọng.', '2024-02-25 11:45:00'),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440014', 'P00005', 5, 'Công nghệ hiện đại, sạc nhanh. Đặt trong xe rất tiện lợi.', '2024-02-26 15:00:00'),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440015', 'P00005', 4, 'Sản phẩm tốt nhưng chỉ tương thích với một số mẫu xe. Cần kiểm tra trước khi mua.', '2024-02-27 10:20:00'),

-- Product P00006 reviews (Pin dự phòng)
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 'P00006', 4, 'Dung lượng lớn, sạc được nhiều lần. Hơi nặng nhưng chấp nhận được.', '2024-02-28 13:30:00'),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440005', 'P00006', 5, 'Pin chất lượng cao, sạc nhanh cho điện thoại và tablet. Must-have cho xe điện!', '2024-03-01 09:00:00'),

-- Product P00007 reviews (Bộ chuyển đổi nguồn)
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440007', 'P00007', 5, 'Chuyển đổi chuẩn điện rất tốt, không bị mất công suất. Cần thiết khi đi nước ngoài.', '2024-03-02 14:45:00'),
('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440009', 'P00007', 4, 'Sản phẩm đúng chức năng, nhỏ gọn dễ mang theo.', '2024-03-03 11:15:00'),

-- Product P00008 reviews (Ổ cắm thông minh)
('650e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440011', 'P00008', 5, 'Ổ cắm thông minh tiện lợi, điều khiển qua app rất dễ. Tự động ngắt khi sạc đầy.', '2024-03-04 16:00:00'),
('650e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440013', 'P00008', 5, 'Tính năng hẹn giờ sạc giúp tiết kiệm điện. Sản phẩm công nghệ cao!', '2024-03-05 10:30:00'),
('650e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440015', 'P00008', 4, 'Kết nối WiFi ổn định, giao diện app đơn giản. Đáng tiền!', '2024-03-06 13:45:00');

-- ===================================
-- 3. SEED WISHLIST TABLE
-- ===================================
INSERT INTO wishlist (user_id, product_id, created_at) VALUES
-- User 550e8400-e29b-41d4-a716-446655440003 wishlist
('550e8400-e29b-41d4-a716-446655440003', 'c1d2e3f4-5678-90ab-cdef-123456789014', '2024-03-07 09:00:00'),
('550e8400-e29b-41d4-a716-446655440003', 'c1d2e3f4-5678-90ab-cdef-123456789017', '2024-03-07 09:05:00'),
('550e8400-e29b-41d4-a716-446655440003', 'c1d2e3f4-5678-90ab-cdef-123456789001', '2024-03-08 10:20:00'),

-- User 550e8400-e29b-41d4-a716-446655440004 wishlist
('550e8400-e29b-41d4-a716-446655440004', 'c1d2e3f4-5678-90ab-cdef-123456789012', '2024-03-07 11:30:00'),
('550e8400-e29b-41d4-a716-446655440004', 'c1d2e3f4-5678-90ab-cdef-123456789016', '2024-03-08 14:15:00'),

-- User 550e8400-e29b-41d4-a716-446655440005 wishlist
('550e8400-e29b-41d4-a716-446655440005', 'c1d2e3f4-5678-90ab-cdef-123456789011', '2024-03-08 08:45:00'),
('550e8400-e29b-41d4-a716-446655440005', 'c1d2e3f4-5678-90ab-cdef-123456789018', '2024-03-09 16:30:00'),
('550e8400-e29b-41d4-a716-446655440005', 'c1d2e3f4-5678-90ab-cdef-123456789002', '2024-03-09 16:35:00'),

-- User 550e8400-e29b-41d4-a716-446655440006 wishlist
('550e8400-e29b-41d4-a716-446655440006', 'c1d2e3f4-5678-90ab-cdef-123456789010', '2024-03-09 10:00:00'),
('550e8400-e29b-41d4-a716-446655440006', 'c1d2e3f4-5678-90ab-cdef-123456789013', '2024-03-10 13:20:00'),

-- User 550e8400-e29b-41d4-a716-446655440007 wishlist
('550e8400-e29b-41d4-a716-446655440007', 'c1d2e3f4-5678-90ab-cdef-123456789015', '2024-03-10 09:15:00'),
('550e8400-e29b-41d4-a716-446655440007', 'c1d2e3f4-5678-90ab-cdef-123456789003', '2024-03-11 11:45:00'),

-- User 550e8400-e29b-41d4-a716-446655440008 wishlist
('550e8400-e29b-41d4-a716-446655440008', 'c1d2e3f4-5678-90ab-cdef-123456789017', '2024-03-11 14:00:00'),
('550e8400-e29b-41d4-a716-446655440008', 'c1d2e3f4-5678-90ab-cdef-123456789004', '2024-03-12 10:30:00'),

-- User 550e8400-e29b-41d4-a716-446655440009 wishlist
('550e8400-e29b-41d4-a716-446655440009', 'c1d2e3f4-5678-90ab-cdef-123456789014', '2024-03-12 15:20:00'),
('550e8400-e29b-41d4-a716-446655440009', 'c1d2e3f4-5678-90ab-cdef-123456789005', '2024-03-13 09:00:00'),

-- User 550e8400-e29b-41d4-a716-446655440010 wishlist
('550e8400-e29b-41d4-a716-446655440010', 'c1d2e3f4-5678-90ab-cdef-123456789006', '2024-03-13 13:45:00'),

-- User 550e8400-e29b-41d4-a716-446655440011 wishlist
('550e8400-e29b-41d4-a716-446655440011', 'c1d2e3f4-5678-90ab-cdef-123456789016', '2024-03-14 10:15:00'),
('550e8400-e29b-41d4-a716-446655440011', 'c1d2e3f4-5678-90ab-cdef-123456789018', '2024-03-14 10:20:00'),

-- User 550e8400-e29b-41d4-a716-446655440012 wishlist
('550e8400-e29b-41d4-a716-446655440012', 'c1d2e3f4-5678-90ab-cdef-123456789002', '2024-03-15 11:30:00'),

-- User 550e8400-e29b-41d4-a716-446655440013 wishlist
('550e8400-e29b-41d4-a716-446655440013', 'c1d2e3f4-5678-90ab-cdef-123456789012', '2024-03-15 14:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 'c1d2e3f4-5678-90ab-cdef-123456789015', '2024-03-16 09:30:00'),

-- User 550e8400-e29b-41d4-a716-446655440014 wishlist
('550e8400-e29b-41d4-a716-446655440014', 'c1d2e3f4-5678-90ab-cdef-123456789003', '2024-03-16 15:45:00'),
('550e8400-e29b-41d4-a716-446655440014', 'c1d2e3f4-5678-90ab-cdef-123456789004', '2024-03-17 10:00:00'),

-- User 550e8400-e29b-41d4-a716-446655440015 wishlist
('550e8400-e29b-41d4-a716-446655440015', 'c1d2e3f4-5678-90ab-cdef-123456789010', '2024-03-17 13:20:00'),
('550e8400-e29b-41d4-a716-446655440015', 'c1d2e3f4-5678-90ab-cdef-123456789005', '2024-03-18 09:15:00'),
('550e8400-e29b-41d4-a716-446655440001', 'c1d2e3f4-5678-90ab-cdef-123456789001', NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'c1d2e3f4-5678-90ab-cdef-123456789006', NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'c1d2e3f4-5678-90ab-cdef-123456789010', NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'c1d2e3f4-5678-90ab-cdef-123456789011', NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'c1d2e3f4-5678-90ab-cdef-123456789015', NOW());
-- ===================================
-- 4. SEED CHAT_MESSAGES TABLE
-- ===================================
INSERT INTO chat_messages (id, user_id, admin_id, message, sender, created_at) VALUES
-- Conversation 1: User 550e8400-e29b-41d4-a716-446655440003 with Admin 550e8400-e29b-41d4-a716-446655440001
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Xin chào, tôi muốn hỏi về sạc Tesla có còn hàng không?', 'user', '2024-03-18 09:00:00'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Chào bạn! Hiện tại sạc Tesla vẫn còn hàng. Bạn cần loại công suất bao nhiêu?', 'admin', '2024-03-18 09:02:00'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Tôi cần loại 50kW. Giá bao nhiêu vậy shop?', 'user', '2024-03-18 09:05:00'),
('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Giá 15.500.000đ ạ. Shop đang có chương trình giảm 10% còn 13.950.000đ. Bạn quan tâm không?', 'admin', '2024-03-18 09:07:00'),
('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Ok, để tôi xem xét thêm. Cảm ơn shop!', 'user', '2024-03-18 09:10:00'),

-- Conversation 2: User 550e8400-e29b-41d4-a716-446655440005 with Admin 550e8400-e29b-41d4-a716-446655440002
('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Admin ơi, cho tôi hỏi sạc di động VinFast có bảo hành không?', 'user', '2024-03-18 10:30:00'),
('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Chào bạn! Sản phẩm được bảo hành 12 tháng chính hãng ạ.', 'admin', '2024-03-18 10:32:00'),
('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Tuyệt vời! Vậy thời gian giao hàng bao lâu?', 'user', '2024-03-18 10:35:00'),
('850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Nội thành HCM giao trong 24h, ngoại thành 2-3 ngày ạ.', 'admin', '2024-03-18 10:37:00'),
('850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Ok thanks, tôi sẽ đặt hàng ngay!', 'user', '2024-03-18 10:40:00'),

-- Conversation 3: User 550e8400-e29b-41d4-a716-446655440007 with Admin 550e8400-e29b-41d4-a716-446655440001
('850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'Shop có hướng dẫn lắp đặt cáp sạc Type 2 không?', 'user', '2024-03-18 14:15:00'),
('850e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'Dạ có ạ! Shop có video hướng dẫn chi tiết và nhân viên hỗ trợ tư vấn qua điện thoại.', 'admin', '2024-03-18 14:18:00'),
('850e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'Tốt quá! Cho tôi số hotline nhé.', 'user', '2024-03-18 14:20:00'),
('850e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'Hotline: 1900-xxxx (8h-22h hàng ngày). Bạn cần hỗ trợ thêm gì không?', 'admin', '2024-03-18 14:22:00'),

-- Conversation 4: User 550e8400-e29b-41d4-a716-446655440009 with Admin 550e8400-e29b-41d4-a716-446655440002
('850e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 'Adapter CCS2 có tương thích với xe Hyundai Kona không?', 'user', '2024-03-18 15:45:00'),
('850e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 'Có ạ! Adapter CCS2 tương thích với hầu hết xe điện Châu Âu bao gồm Hyundai Kona.', 'admin', '2024-03-18 15:47:00'),
('850e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 'Perfect! Tôi đặt 1 cái nhé.', 'user', '2024-03-18 15:50:00'),

-- Conversation 5: User 550e8400-e29b-41d4-a716-446655440011 with Admin 550e8400-e29b-41d4-a716-446655440001
('850e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Đế sạc không dây có phù hợp với xe BMW i3 không ạ?', 'user', '2024-03-19 09:30:00'),
('850e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Dạ BMW i3 cần kiểm tra model năm sản xuất. Bạn cho shop biết năm xe để tư vấn chính xác ạ.', 'admin', '2024-03-19 09:33:00'),
('850e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Xe của tôi năm 2022. Có được không shop?', 'user', '2024-03-19 09:35:00'),
('850e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Dạ được ạ! BMW i3 từ 2020 trở lên đều tương thích với đế sạc không dây của shop.', 'admin', '2024-03-19 09:37:00'),

-- Conversation 6: User 550e8400-e29b-41d4-a716-446655440013 with Admin 550e8400-e29b-41d4-a716-446655440002
('850e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Pin dự phòng dung lượng 20000mAh có đủ sạc cho laptop không?', 'user', '2024-03-19 11:00:00'),
('850e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Dạ có ạ! Pin hỗ trợ sạc laptop qua cổng USB-C PD với công suất tối đa 65W.', 'admin', '2024-03-19 11:03:00'),
('850e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Tuyệt vời! Vậy sạc đầy pin mất bao lâu?', 'user', '2024-03-19 11:05:00'),
('850e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Sạc đầy mất khoảng 4-5 giờ với sạc nhanh 18W ạ.', 'admin', '2024-03-19 11:07:00'),

-- Conversation 7: User 550e8400-e29b-41d4-a716-446655440015 with Admin 550e8400-e29b-41d4-a716-446655440001
('850e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Ổ cắm thông minh có tương thích với Google Home không?', 'user', '2024-03-19 14:20:00'),
('850e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Dạ có ạ! Ổ cắm tương thích với cả Google Home và Amazon Alexa.', 'admin', '2024-03-19 14:22:00'),
('850e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Perfect! Tôi muốn mua 2 cái. Có giảm giá không?', 'user', '2024-03-19 14:25:00'),
('850e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Dạ mua 2 được giảm thêm 5% ạ. Tổng giá 1.805.000đ (từ 1.900.000đ).', 'admin', '2024-03-19 14:27:00'),
('850e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Ok deal! Tôi sẽ đặt hàng ngay bây giờ.', 'user', '2024-03-19 14:30:00');

-- ===================================
-- VERIFY DATA
-- ===================================
SELECT 'Users' AS table_name, COUNT(*) AS total_records FROM users
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'Wishlist', COUNT(*) FROM wishlist
UNION ALL
SELECT 'Chat Messages', COUNT(*) FROM chat_messages;

-- ===================================
-- NOTES
-- ===================================
-- Password hash: $2b$10$XQqhN5Z5YxJZqF8wYz0kYe... (bcrypt hash của "Password123!")
-- Để test login, dùng password: "Password123!"
-- 
-- Summary:
-- - 15 users (2 admin, 13 regular users) - UUID format
-- - 20 reviews (đa dạng sản phẩm từ P00001 đến P00008) - UUID format
-- - 26 wishlist items (phân bổ cho các user) - UUID format
-- - 30 chat messages (7 conversations với admin) - UUID format
--
-- Product IDs được tham chiếu: P00001 đến P00015
-- (Cần tạo tương ứng trong Catalog Service)
-- ============================================
-- SEED DATA FOR ORDERS DATABASE
-- ============================================

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM payments;
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM coupons;

-- ============================================
-- COUPONS
-- ============================================
INSERT INTO coupons (id, code, discount_type, discount_value, start_at, end_at, quantity, max_discount, min_order_value) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'WELCOME10', 'PERCENT', 10, '2024-01-01 00:00:00', '2025-12-31 23:59:59', 1000, 50, 0),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'SUMMER20', 'PERCENT', 20, '2024-06-01 00:00:00', '2024-08-31 23:59:59', 500, 100, 0),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'FLASH50', 'PERCENT', 50, '2024-11-01 00:00:00', '2024-11-30 23:59:59', 100, 200, 0),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'NEWYEAR25', 'PERCENT', 25, '2025-01-01 00:00:00', '2025-01-31 23:59:59', 200, 150, 0),
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'VIP15', 'PERCENT', 15, '2024-01-01 00:00:00', '2025-12-31 23:59:59', 50, 100, 0);

-- ============================================
-- ORDERS
-- ============================================
INSERT INTO orders (id, user_id, status, total_price, discount_amount, created_at, updated_at) VALUES
-- Completed orders
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', '11111111-1111-1111-1111-111111111111', 'completed', 1250000.00, 125000.00, '2024-11-01 10:30:00', '2024-11-05 14:20:00'),
('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', '22222222-2222-2222-2222-222222222222', 'completed', 850000.00, 0.00, '2024-11-02 14:15:00', '2024-11-06 09:30:00'),
('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', '33333333-3333-3333-3333-333333333333', 'completed', 2500000.00, 500000.00, '2024-11-03 09:20:00', '2024-11-08 16:45:00'),
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', '11111111-1111-1111-1111-111111111111', 'completed', 450000.00, 45000.00, '2024-11-05 11:00:00', '2024-11-09 10:15:00'),
('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', '44444444-4444-4444-4444-444444444444', 'completed', 3200000.00, 0.00, '2024-11-07 15:30:00', '2024-11-12 11:20:00'),

-- Shipping orders
('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', '55555555-5555-5555-5555-555555555555', 'shipping', 1800000.00, 360000.00, '2024-11-20 08:45:00', '2024-11-22 10:00:00'),
('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', '22222222-2222-2222-2222-222222222222', 'shipping', 950000.00, 0.00, '2024-11-21 13:20:00', '2024-11-23 09:15:00'),
('a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', '66666666-6666-6666-6666-666666666666', 'shipping', 1500000.00, 150000.00, '2024-11-22 16:10:00', '2024-11-24 14:30:00'),

-- Paid orders (waiting for shipping)
('b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', '77777777-7777-7777-7777-777777777777', 'paid', 680000.00, 0.00, '2024-11-25 10:00:00', '2024-11-25 10:05:00'),
('c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', '33333333-3333-3333-3333-333333333333', 'paid', 2100000.00, 525000.00, '2024-11-26 11:30:00', '2024-11-26 11:35:00'),
('d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a', '88888888-8888-8888-8888-888888888888', 'paid', 1200000.00, 120000.00, '2024-11-27 09:20:00', '2024-11-27 09:25:00'),

-- Pending orders
('e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b', '99999999-9999-9999-9999-999999999999', 'pending', 540000.00, 0.00, '2024-11-27 14:15:00', '2024-11-27 14:15:00'),
('f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c', '44444444-4444-4444-4444-444444444444', 'pending', 890000.00, 89000.00, '2024-11-27 16:45:00', '2024-11-27 16:45:00'),
('a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending', 1650000.00, 0.00, '2024-11-28 08:30:00', '2024-11-28 08:30:00'),

-- Cancelled orders
('b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e', '55555555-5555-5555-5555-555555555555', 'cancelled', 750000.00, 150000.00, '2024-11-10 12:00:00', '2024-11-11 10:30:00'),
('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', '66666666-6666-6666-6666-666666666666', 'cancelled', 320000.00, 0.00, '2024-11-15 15:20:00', '2024-11-15 16:00:00');

-- ============================================
-- ORDER ITEMS
-- ============================================
INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
-- Order 1 items
('d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'p1111111-1111-1111-1111-111111111111', 2, 500000.00),
('e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'p2222222-2222-2222-2222-222222222222', 1, 375000.00),

-- Order 2 items
('f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c', 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'p3333333-3333-3333-3333-333333333333', 1, 850000.00),

-- Order 3 items
('a5b6c7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d', 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'p4444444-4444-4444-4444-444444444444', 1, 2000000.00),
('b6c7d8e9-f0a1-4b2c-3d4e-5f6a7b8c9d0e', 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'p5555555-5555-5555-5555-555555555555', 2, 250000.00),

-- Order 4 items
('c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f', 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'p6666666-6666-6666-6666-666666666666', 3, 150000.00),

-- Order 5 items
('d8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a', 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'p7777777-7777-7777-7777-777777777777', 1, 3200000.00),

-- Order 6 items
('e9f0a1b2-c3d4-4e5f-6a7b-8c9d0e1f2a3b', 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'p8888888-8888-8888-8888-888888888888', 2, 600000.00),
('f0a1b2c3-d4e5-4f6a-7b8c-9d0e1f2a3b4c', 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'p9999999-9999-9999-9999-999999999999', 1, 600000.00),

-- Order 7 items
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'paaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 450000.00),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'pbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 500000.00),

-- Order 8 items
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 'pcccccc-cccc-cccc-cccc-cccccccccccc', 2, 750000.00),

-- Order 9 items
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', 'pdddddd-dddd-dddd-dddd-dddddddddddd', 1, 680000.00),

-- Order 10 items
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'peeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, 1500000.00),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'pffffff-ffff-ffff-ffff-ffffffffffff', 2, 300000.00),

-- Order 11 items
('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'd6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a', 'p0000000-0000-0000-0000-000000000001', 3, 400000.00),

-- Order 12 items
('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b', 'p0000000-0000-0000-0000-000000000002', 2, 270000.00),

-- Order 13 items
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c', 'p0000000-0000-0000-0000-000000000003', 1, 890000.00),

-- Order 14 items
('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', 'p0000000-0000-0000-0000-000000000004', 1, 1200000.00),
('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', 'p0000000-0000-0000-0000-000000000005', 1, 450000.00),

-- Order 15 items (cancelled)
('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e', 'p0000000-0000-0000-0000-000000000006', 2, 375000.00),

-- Order 16 items (cancelled)
('a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', 'p0000000-0000-0000-0000-000000000007', 1, 320000.00);


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check total records
SELECT 
    'Coupons' as table_name, COUNT(*) as record_count FROM coupons
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;

-- Check orders summary by status
SELECT 
    status,
    COUNT(*) as order_count,
    SUM(total_price) as total_revenue,
    SUM(discount_amount) as total_discount
FROM orders
GROUP BY status
ORDER BY FIELD(status, 'pending', 'paid', 'shipping', 'completed', 'cancelled', 'confirmed');
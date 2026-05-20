-- ============================================================
-- seed.sql — Dữ liệu mẫu cho HảiSản.vn
-- Chạy: mysql -u root -p seafood_db < sql/seed.sql
-- ============================================================

USE seafood_db;

-- ─── Users ──────────────────────────────────────────────────
-- Mật khẩu mẫu: password123 (bcrypt hash)
INSERT IGNORE INTO User (Name, Phone, PasswordHash, Role) VALUES
  ('Admin', '0000000000', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'Admin'),
  ('Nguyễn Văn Bình', '0912345678', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User'),
  ('Trần Thị Lan', '0987654321', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User'),
  ('Lê Minh Tuấn', '0934567890', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User'),
  ('Phạm Thu Hương', '0965432109', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User'),
  ('Võ Thị Mai', '0978901234', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User'),
  ('Nguyễn Văn An', '0901234567', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User'),
  ('Trần Văn Dũng', '0923456789', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User');
-- ⚠️  Hash trên tương ứng mật khẩu "password123"
--    Để tạo hash mới: node -e "const b=require('bcryptjs');b.hash('password123',10).then(console.log)"

-- ─── Products ───────────────────────────────────────────────
INSERT IGNORE INTO Product (SellerID, Type, Name, Description, Price, SalesType, TotalWeight, RemainingWeight, Status, CatchTime, Lat, Lng, Origin, ExpiryDate) VALUES
  (2,'Fresh','Cá Thu Tươi','Cá thu vừa cập bến, còn tươi nguyên. Thịt chắc, ngọt nước. Mua buôn liên hệ giảm giá.',180000,'Retail',50,38,'Active',NOW() - INTERVAL 5 HOUR,20.8449,106.6881,NULL,NULL),
  (3,'Fresh','Tôm Hùm Sống','Tôm hùm sống, nhập từ tàu đánh cá ngoài khơi. Cam kết tươi sống.',850000,'Retail',20,12,'Active',NOW() - INTERVAL 2 HOUR,20.8600,106.7000,NULL,NULL),
  (4,'Fresh','Cua Biển Gạch Son','Cua biển gạch son, bán nguyên rổ 30kg. Cua cái nhiều gạch.',320000,'Wholesale',30,30,'Active',NOW() - INTERVAL 8 HOUR,20.8300,106.6700,NULL,NULL),
  (2,'Fresh','Mực Ống Tươi','Mực ống tươi rói, vừa kéo lên. Mực ngon, thịt dày.',150000,'Retail',40,40,'Active',NOW() - INTERVAL 1 HOUR,20.8500,106.6900,NULL,NULL),
  (5,'Dried','Mực Khô Phú Quốc','Mực một nắng Phú Quốc, thơm đặc trưng. Hàng chính gốc không tẩm phụ gia.',680000,'Retail',100,75,'Active',NULL,NULL,NULL,'Phú Quốc','2025-12-31'),
  (6,'Dried','Cá Khô Thiều Bình Thuận','Cá thiều khô Bình Thuận, phơi tự nhiên 2 nắng. Không chất bảo quản.',280000,'Retail',50,50,'Active',NULL,NULL,NULL,'Bình Thuận','2026-03-15'),
  (7,'Dried','Tôm Khô Cà Mau','Tôm khô Cà Mau size lớn, màu đỏ đẹp, không tẩm hóa chất.',420000,'Retail',30,20,'Active',NULL,NULL,NULL,'Cà Mau','2025-09-30'),
  (8,'Dried','Cá Cơm Rim Nước Mắm','Cá cơm rim nước mắm nhà làm, vị ngọt tự nhiên.',180000,'Retail',20,18,'Active',NULL,NULL,NULL,'Nha Trang','2025-08-20');

-- ─── Messages mẫu ────────────────────────────────────────────
INSERT IGNORE INTO Message (ProductID, SenderID, ReceiverID, Content) VALUES
  (1, 3, 2, 'Bác ơi cá thu còn không?'),
  (1, 2, 3, 'Còn bác ơi, còn khoảng 38kg'),
  (1, 3, 2, 'Mua 5kg giá bao nhiêu?');

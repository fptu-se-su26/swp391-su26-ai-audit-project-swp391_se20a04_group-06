/*
 Navicat Premium Data Transfer

 Source Server         : nro
 Source Server Type    : MySQL
 Source Server Version : 100427
 Source Host           : localhost:3306
 Source Schema         : seafood_db

 Target Server Type    : MySQL
 Target Server Version : 100427
 File Encoding         : 65001

 Date: 22/05/2026 07:10:27
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for follow
-- ----------------------------
DROP TABLE IF EXISTS `follow`;
CREATE TABLE `follow`  (
  `FollowID` int NOT NULL AUTO_INCREMENT,
  `FollowerID` int NOT NULL,
  `SellerID` int NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`FollowID`) USING BTREE,
  UNIQUE INDEX `unique_follow`(`FollowerID` ASC, `SellerID` ASC) USING BTREE,
  INDEX `SellerID`(`SellerID` ASC) USING BTREE,
  CONSTRAINT `follow_ibfk_1` FOREIGN KEY (`FollowerID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `follow_ibfk_2` FOREIGN KEY (`SellerID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of follow
-- ----------------------------

-- ----------------------------
-- Table structure for message
-- ----------------------------
DROP TABLE IF EXISTS `message`;
CREATE TABLE `message`  (
  `MessageID` int NOT NULL AUTO_INCREMENT,
  `ProductID` int NOT NULL COMMENT 'Cuộc trò chuyện gắn với bài đăng nào',
  `SenderID` int NOT NULL,
  `ReceiverID` int NOT NULL,
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `IsRead` tinyint(1) NOT NULL DEFAULT 0,
  `SentAt` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`MessageID`) USING BTREE,
  INDEX `ReceiverID`(`ReceiverID` ASC) USING BTREE,
  INDEX `idx_message_product`(`ProductID` ASC) USING BTREE,
  INDEX `idx_message_sender`(`SenderID` ASC) USING BTREE,
  CONSTRAINT `message_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `message_ibfk_2` FOREIGN KEY (`SenderID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `message_ibfk_3` FOREIGN KEY (`ReceiverID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of message
-- ----------------------------
INSERT INTO `message` VALUES (1, 1, 3, 2, 'Bác ơi cá thu còn không?', 0, '2026-05-20 06:42:02');
INSERT INTO `message` VALUES (2, 1, 2, 3, 'Còn bác ơi, còn khoảng 38kg', 0, '2026-05-20 06:42:02');
INSERT INTO `message` VALUES (3, 1, 3, 2, 'Mua 5kg giá bao nhiêu?', 0, '2026-05-20 06:42:02');
INSERT INTO `message` VALUES (4, 9, 10, 9, 'nút lưỡi nhau không', 1, '2026-05-20 09:39:29');
INSERT INTO `message` VALUES (5, 9, 9, 10, 'ok mấy giờ baby three', 1, '2026-05-20 09:52:19');
INSERT INTO `message` VALUES (6, 6, 10, 6, 'hello', 0, '2026-05-20 09:57:48');
INSERT INTO `message` VALUES (7, 9, 10, 9, 'ok', 1, '2026-05-20 10:06:47');
INSERT INTO `message` VALUES (8, 9, 9, 10, 'ok', 1, '2026-05-20 10:07:26');
INSERT INTO `message` VALUES (9, 10, 9, 10, 'kk', 1, '2026-05-20 10:30:40');

-- ----------------------------
-- Table structure for notification
-- ----------------------------
DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification`  (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `IsRead` tinyint(1) NOT NULL DEFAULT 0,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp,
  `ProductID` int NULL DEFAULT NULL,
  `ReviewID` int NULL DEFAULT NULL,
  PRIMARY KEY (`NotificationID`) USING BTREE,
  INDEX `UserID`(`UserID` ASC) USING BTREE,
  INDEX `fk_notification_product`(`ProductID` ASC) USING BTREE,
  INDEX `fk_notification_review`(`ReviewID` ASC) USING BTREE,
  CONSTRAINT `fk_notification_product` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_notification_review` FOREIGN KEY (`ReviewID`) REFERENCES `review` (`ReviewID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notification
-- ----------------------------
INSERT INTO `notification` VALUES (1, 10, 'new_review', 'Đậu Đình Bút đã đánh giá 3⭐ cho \"cá ba sa\": \"hehe\"', 1, '2026-05-20 15:37:13', NULL, NULL);
INSERT INTO `notification` VALUES (2, 9, 'new_review', 'Đậu Đình A đã đánh giá 1⭐ cho \"dog fish\": \"tệ\"', 1, '2026-05-20 16:02:58', 9, 4);
INSERT INTO `notification` VALUES (3, 9, 'new_review', 'Đậu Đình A đã đánh giá 2⭐ cho \"dog fish\": \"nôml\"', 1, '2026-05-20 16:04:08', 9, 5);

-- ----------------------------
-- Table structure for product
-- ----------------------------
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product`  (
  `ProductID` int NOT NULL AUTO_INCREMENT,
  `SellerID` int NOT NULL,
  `Type` enum('Fresh','Dried') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `Price` int NOT NULL COMMENT 'VND / kg',
  `SalesType` enum('Retail','Wholesale') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Retail',
  `TotalWeight` decimal(8, 2) NOT NULL,
  `RemainingWeight` decimal(8, 2) NOT NULL,
  `Status` enum('Active','Expired','Deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `CatchTime` datetime NULL DEFAULT NULL COMMENT 'Thời điểm đánh bắt / cập bến',
  `Lat` decimal(10, 7) NULL DEFAULT NULL COMMENT 'GPS latitude của tàu cập bến',
  `Lng` decimal(10, 7) NULL DEFAULT NULL COMMENT 'GPS longitude của tàu cập bến',
  `Origin` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'Xuất xứ (tỉnh / địa danh)',
  `ExpiryDate` date NULL DEFAULT NULL COMMENT 'Hạn sử dụng',
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`ProductID`) USING BTREE,
  INDEX `idx_product_type_status`(`Type` ASC, `Status` ASC) USING BTREE,
  INDEX `idx_product_seller`(`SellerID` ASC) USING BTREE,
  INDEX `idx_product_catchtime`(`CatchTime` ASC) USING BTREE,
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`SellerID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of product
-- ----------------------------
INSERT INTO `product` VALUES (1, 2, 'Fresh', 'Cá Thu Tươi', 'Cá thu vừa cập bến, còn tươi nguyên. Thịt chắc, ngọt nước. Mua buôn liên hệ giảm giá.', 180000, 'Retail', 50.00, 38.00, 'Active', '2026-05-20 01:42:02', 20.8449000, 106.6881000, NULL, NULL, '2026-05-20 06:42:02');
INSERT INTO `product` VALUES (2, 3, 'Fresh', 'Tôm Hùm Sống', 'Tôm hùm sống, nhập từ tàu đánh cá ngoài khơi. Cam kết tươi sống.', 850000, 'Retail', 20.00, 12.00, 'Active', '2026-05-20 04:42:02', 20.8600000, 106.7000000, NULL, NULL, '2026-05-20 06:42:02');
INSERT INTO `product` VALUES (3, 4, 'Fresh', 'Cua Biển Gạch Son', 'Cua biển gạch son, bán nguyên rổ 30kg. Cua cái nhiều gạch.', 320000, 'Wholesale', 30.00, 30.00, 'Active', '2026-05-19 22:42:02', 20.8300000, 106.6700000, NULL, NULL, '2026-05-20 06:42:02');
INSERT INTO `product` VALUES (4, 2, 'Fresh', 'Mực Ống Tươi', 'Mực ống tươi rói, vừa kéo lên. Mực ngon, thịt dày.', 150000, 'Retail', 40.00, 40.00, 'Active', '2026-05-20 05:42:02', 20.8500000, 106.6900000, NULL, NULL, '2026-05-20 06:42:02');
INSERT INTO `product` VALUES (5, 5, 'Dried', 'Mực Khô Phú Quốc', 'Mực một nắng Phú Quốc, thơm đặc trưng. Hàng chính gốc không tẩm phụ gia.', 680000, 'Retail', 100.00, 75.00, 'Active', NULL, NULL, NULL, 'Phú Quốc', '2025-12-31', '2026-05-20 06:42:02');
INSERT INTO `product` VALUES (6, 6, 'Dried', 'Cá Khô Thiều Bình Thuận', 'Cá thiều khô Bình Thuận, phơi tự nhiên 2 nắng. Không chất bảo quản.', 280000, 'Retail', 50.00, 50.00, 'Active', NULL, NULL, NULL, 'Bình Thuận', '2026-03-15', '2026-05-20 06:42:02');
INSERT INTO `product` VALUES (7, 7, 'Dried', 'Tôm Khô Cà Mau', 'Tôm khô Cà Mau size lớn, màu đỏ đẹp, không tẩm hóa chất.', 420000, 'Retail', 30.00, 20.00, 'Active', NULL, NULL, NULL, 'Cà Mau', '2025-09-30', '2026-05-20 06:42:02');
INSERT INTO `product` VALUES (8, 8, 'Dried', 'Cá Cơm Rim Nước Mắm', 'Cá cơm rim nước mắm nhà làm, vị ngọt tự nhiên.', 180000, 'Retail', 20.00, 18.00, 'Active', NULL, NULL, NULL, 'Nha Trang', '2025-08-20', '2026-05-20 06:42:02');
INSERT INTO `product` VALUES (9, 9, 'Fresh', 'dog fish', 'cá rất tươi', 1, 'Retail', 1.00, 1.00, 'Active', '2026-05-20 09:37:00', 15.9687827, 108.2602516, NULL, NULL, '2026-05-20 09:37:52');
INSERT INTO `product` VALUES (10, 10, 'Fresh', 'cá ba sa', 'cá béo', 3, 'Retail', 1.00, 1.00, 'Active', '2026-05-20 09:56:00', 15.9687982, 108.2603188, NULL, NULL, '2026-05-20 09:56:49');
INSERT INTO `product` VALUES (11, 9, 'Dried', 'Mực Ống', 'hèa', 3, 'Retail', 3.00, 3.00, 'Active', NULL, NULL, NULL, 'chinaa', '2026-05-20', '2026-05-20 16:19:44');
INSERT INTO `product` VALUES (12, 9, 'Dried', 'Mực Ống', 'hèa', 3, 'Retail', 3.00, 3.00, 'Active', NULL, NULL, NULL, 'chinaa', '2026-05-20', '2026-05-20 16:19:48');
INSERT INTO `product` VALUES (13, 9, 'Dried', 'Mực Ống', 'hèa', 3, 'Retail', 3.00, 3.00, 'Active', NULL, NULL, NULL, 'chinaa', '2026-05-20', '2026-05-20 16:19:59');
INSERT INTO `product` VALUES (14, 9, 'Fresh', 'hehe', 'g', 1, 'Retail', 1.00, 1.00, 'Active', '2026-05-20 16:27:00', 15.9681738, 108.2623783, 'Phường Ngũ Hành Sơn, Thành phố Đà Nẵng', NULL, '2026-05-20 16:27:14');

-- ----------------------------
-- Table structure for productimage
-- ----------------------------
DROP TABLE IF EXISTS `productimage`;
CREATE TABLE `productimage`  (
  `ImageID` int NOT NULL AUTO_INCREMENT,
  `ProductID` int NOT NULL,
  `CloudinaryURL` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `PublicID` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Cloudinary public_id để xoá',
  `SortOrder` tinyint NOT NULL DEFAULT 0,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`ImageID`) USING BTREE,
  INDEX `ProductID`(`ProductID` ASC) USING BTREE,
  CONSTRAINT `productimage_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of productimage
-- ----------------------------
INSERT INTO `productimage` VALUES (1, 9, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779244633/seafood/xignyacrjo482kucectp.jpg', 'seafood/xignyacrjo482kucectp', 0, '2026-05-20 09:37:57');
INSERT INTO `productimage` VALUES (2, 10, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779245771/seafood/wrpcelkwiih5nlzp0eum.jpg', 'seafood/wrpcelkwiih5nlzp0eum', 0, '2026-05-20 09:56:54');
INSERT INTO `productimage` VALUES (3, 13, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779268761/seafood/a9kfajvi5hyvvieloigo.jpg', 'seafood/a9kfajvi5hyvvieloigo', 0, '2026-05-20 16:20:06');
INSERT INTO `productimage` VALUES (4, 13, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779268763/seafood/yvwqzzdbsqmccgr4xu1a.jpg', 'seafood/yvwqzzdbsqmccgr4xu1a', 1, '2026-05-20 16:20:07');
INSERT INTO `productimage` VALUES (5, 13, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779268765/seafood/pq5xe5fokaheog7h8ax9.jpg', 'seafood/pq5xe5fokaheog7h8ax9', 2, '2026-05-20 16:20:09');
INSERT INTO `productimage` VALUES (6, 14, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779269194/seafood/pryg9slp35oa462rsu3l.jpg', 'seafood/pryg9slp35oa462rsu3l', 0, '2026-05-20 16:27:18');
INSERT INTO `productimage` VALUES (7, 14, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779269196/seafood/vwxt3vzp1woa9bxoplth.jpg', 'seafood/vwxt3vzp1woa9bxoplth', 1, '2026-05-20 16:27:21');
INSERT INTO `productimage` VALUES (8, 14, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779269199/seafood/ruxfxb7cfwfsxdltoaua.jpg', 'seafood/ruxfxb7cfwfsxdltoaua', 2, '2026-05-20 16:27:24');
INSERT INTO `productimage` VALUES (9, 14, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779269201/seafood/hkknoufdviqf2ad9ea1u.jpg', 'seafood/hkknoufdviqf2ad9ea1u', 3, '2026-05-20 16:27:26');
INSERT INTO `productimage` VALUES (10, 14, 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779269204/seafood/cznwk5otbxipvbutmzup.jpg', 'seafood/cznwk5otbxipvbutmzup', 4, '2026-05-20 16:27:29');

-- ----------------------------
-- Table structure for review
-- ----------------------------
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review`  (
  `ReviewID` int NOT NULL AUTO_INCREMENT,
  `ProductID` int NOT NULL,
  `ReviewerID` int NOT NULL COMMENT 'Người mua viết đánh giá',
  `SellerID` int NOT NULL,
  `Rating` tinyint NOT NULL,
  `Comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `ImageURL` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`ReviewID`) USING BTREE,
  INDEX `ProductID`(`ProductID` ASC) USING BTREE,
  INDEX `ReviewerID`(`ReviewerID` ASC) USING BTREE,
  INDEX `idx_review_seller`(`SellerID` ASC) USING BTREE,
  CONSTRAINT `review_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `review_ibfk_2` FOREIGN KEY (`ReviewerID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `review_ibfk_3` FOREIGN KEY (`SellerID`) REFERENCES `user` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of review
-- ----------------------------
INSERT INTO `review` VALUES (1, 10, 9, 10, 5, 'ngon ngon', 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779251572/reviews/qfdnxa5g5gsxu3bmoyqj.jpg', '2026-05-20 11:33:36');
INSERT INTO `review` VALUES (2, 9, 10, 9, 5, 'test nè', 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779251750/reviews/qqflogjskd9k4v1rzxkr.jpg', '2026-05-20 11:36:33');
INSERT INTO `review` VALUES (3, 10, 9, 10, 3, 'hehe', 'https://res.cloudinary.com/drjmbtafn/image/upload/v1779266188/reviews/pod6mdef1hwc3dms3eew.jpg', '2026-05-20 15:37:13');
INSERT INTO `review` VALUES (4, 9, 10, 9, 1, 'tệ', NULL, '2026-05-20 16:02:58');
INSERT INTO `review` VALUES (5, 9, 10, 9, 2, 'nôml', NULL, '2026-05-20 16:04:08');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Phone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `PasswordHash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Role` enum('User','Admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'User',
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`UserID`) USING BTREE,
  UNIQUE INDEX `Phone`(`Phone` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'Admin', '0000000000', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'Admin', 1, '2026-05-20 06:42:01');
INSERT INTO `user` VALUES (2, 'Nguyễn Văn Bình', '0912345678', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User', 1, '2026-05-20 06:42:01');
INSERT INTO `user` VALUES (3, 'Trần Thị Lan', '0987654321', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User', 1, '2026-05-20 06:42:01');
INSERT INTO `user` VALUES (4, 'Lê Minh Tuấn', '0934567890', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User', 1, '2026-05-20 06:42:01');
INSERT INTO `user` VALUES (5, 'Phạm Thu Hương', '0965432109', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User', 1, '2026-05-20 06:42:01');
INSERT INTO `user` VALUES (6, 'Võ Thị Mai', '0978901234', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User', 1, '2026-05-20 06:42:01');
INSERT INTO `user` VALUES (7, 'Nguyễn Văn An', '0901234567', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User', 1, '2026-05-20 06:42:01');
INSERT INTO `user` VALUES (8, 'Trần Văn Dũng', '0923456789', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/', 'User', 1, '2026-05-20 06:42:01');
INSERT INTO `user` VALUES (9, 'Đậu Đình Bút', '0362614906', '$2a$10$C3/kzv36D3mprKo2G6I.TOLHRD.TaTZBm9JNBIolRKNhdtUsqJvea', 'Admin', 1, '2026-05-20 09:19:08');
INSERT INTO `user` VALUES (10, 'Đậu Đình A', '0362614905', '$2a$10$Bw2918KsHHKdXsXB6nPbje/T8F4aIWB2bsfG4N1C9p3K1hNqxrTD6', 'User', 1, '2026-05-20 09:19:35');

SET FOREIGN_KEY_CHECKS = 1;

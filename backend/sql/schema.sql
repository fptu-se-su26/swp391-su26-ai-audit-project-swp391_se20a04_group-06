-- ============================================================
-- schema.sql — HảiSản.vn Database Schema
-- Chạy: mysql -u root -p < sql/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS seafood_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE seafood_db;

-- ─── User ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS User (
  UserID       INT AUTO_INCREMENT PRIMARY KEY,
  Name         VARCHAR(100)  NOT NULL,
  Phone        VARCHAR(15)   NOT NULL UNIQUE,
  PasswordHash VARCHAR(255)  NOT NULL,
  Role         ENUM('User','Admin') NOT NULL DEFAULT 'User',
  IsActive     TINYINT(1)    NOT NULL DEFAULT 1,
  CreatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Product ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Product (
  ProductID       INT AUTO_INCREMENT PRIMARY KEY,
  SellerID        INT          NOT NULL,
  Type            ENUM('Fresh','Dried') NOT NULL,
  Name            VARCHAR(150) NOT NULL,
  Description     TEXT,
  Price           INT          NOT NULL COMMENT 'VND / kg',
  SalesType       ENUM('Retail','Wholesale') NOT NULL DEFAULT 'Retail',
  TotalWeight     DECIMAL(8,2) NOT NULL,
  RemainingWeight DECIMAL(8,2) NOT NULL,
  Status          ENUM('Active','Expired','Deleted') NOT NULL DEFAULT 'Active',
  -- Hải sản tươi
  CatchTime       DATETIME     NULL COMMENT 'Thời điểm đánh bắt / cập bến',
  Lat             DECIMAL(10,7) NULL COMMENT 'GPS latitude của tàu cập bến',
  Lng             DECIMAL(10,7) NULL COMMENT 'GPS longitude của tàu cập bến',
  -- Hải sản khô
  Origin          VARCHAR(100) NULL COMMENT 'Xuất xứ (tỉnh / địa danh)',
  ExpiryDate      DATE         NULL COMMENT 'Hạn sử dụng',
  CreatedAt       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (SellerID) REFERENCES User(UserID) ON DELETE CASCADE
);

-- ─── ProductImage ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ProductImage (
  ImageID       INT AUTO_INCREMENT PRIMARY KEY,
  ProductID     INT          NOT NULL,
  CloudinaryURL VARCHAR(500) NOT NULL,
  PublicID      VARCHAR(300) NOT NULL COMMENT 'Cloudinary public_id để xoá',
  SortOrder     TINYINT      NOT NULL DEFAULT 0,
  CreatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE
);

-- ─── Message ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Message (
  MessageID  INT AUTO_INCREMENT PRIMARY KEY,
  ProductID  INT          NOT NULL COMMENT 'Cuộc trò chuyện gắn với bài đăng nào',
  SenderID   INT          NOT NULL,
  ReceiverID INT          NOT NULL,
  Content    TEXT         NOT NULL,
  IsRead     TINYINT(1)   NOT NULL DEFAULT 0,
  SentAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ProductID)  REFERENCES Product(ProductID) ON DELETE CASCADE,
  FOREIGN KEY (SenderID)   REFERENCES User(UserID) ON DELETE CASCADE,
  FOREIGN KEY (ReceiverID) REFERENCES User(UserID) ON DELETE CASCADE
);

-- ─── Review (checklist item) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS Review (
  ReviewID   INT AUTO_INCREMENT PRIMARY KEY,
  ProductID  INT  NOT NULL,
  ReviewerID INT  NOT NULL COMMENT 'Người mua viết đánh giá',
  SellerID   INT  NOT NULL,
  Rating     TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
  Comment    TEXT,
  ImageURL   VARCHAR(500) NULL,
  CreatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ProductID)  REFERENCES Product(ProductID) ON DELETE CASCADE,
  FOREIGN KEY (ReviewerID) REFERENCES User(UserID) ON DELETE CASCADE,
  FOREIGN KEY (SellerID)   REFERENCES User(UserID) ON DELETE CASCADE
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_product_type_status  ON Product(Type, Status);
CREATE INDEX idx_product_seller       ON Product(SellerID);
CREATE INDEX idx_product_catchtime    ON Product(CatchTime);
CREATE INDEX idx_message_product      ON Message(ProductID);
CREATE INDEX idx_message_sender       ON Message(SenderID);
CREATE INDEX idx_review_seller        ON Review(SellerID);

-- ─── Follow ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Follow (
  FollowID   INT AUTO_INCREMENT PRIMARY KEY,
  FollowerID INT NOT NULL,
  SellerID   INT NOT NULL,
  CreatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (FollowerID) REFERENCES User(UserID) ON DELETE CASCADE,
  FOREIGN KEY (SellerID)   REFERENCES User(UserID) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (FollowerID, SellerID)
);

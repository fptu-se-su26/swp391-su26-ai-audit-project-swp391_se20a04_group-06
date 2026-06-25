import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
<<<<<<< HEAD
dotenv.config();

export const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            parseInt(process.env.DB_PORT || '3306'),
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASS     || '',
  database:        process.env.DB_NAME     || 'seafood_db',
  waitForConnections: true,
  connectionLimit: 10,
  charset:         'utf8mb4',
});

export async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✅ MySQL connected');

  // Tự động tạo bảng Notification nếu chưa có
  await conn.query(`
    CREATE TABLE IF NOT EXISTS Notification (
      NotificationID INT AUTO_INCREMENT PRIMARY KEY,
      UserID INT NOT NULL,
      Type VARCHAR(50) NOT NULL,
      Content TEXT NOT NULL,
      IsRead TINYINT(1) NOT NULL DEFAULT 0,
      CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ProductID INT NULL,
      ReviewID INT NULL,
      FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
      FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE,
      FOREIGN KEY (ReviewID) REFERENCES Review(ReviewID) ON DELETE CASCADE
    )
  `);

  // Tự động thêm cột ProductID nếu cơ sở dữ liệu cũ chưa có
  try {
    const [cols] = await conn.query("SHOW COLUMNS FROM Notification LIKE 'ProductID'");
    if ((cols as any[]).length === 0) {
      await conn.query(`
        ALTER TABLE Notification 
        ADD COLUMN ProductID INT NULL, 
        ADD CONSTRAINT fk_notification_product FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE
      `);
      console.log('✅ Added ProductID column and foreign key to Notification table');
    }
  } catch (errCol) {
    console.error('Lỗi khi nâng cấp bảng Notification:', errCol);
  }

  // Tự động thêm cột ReviewID nếu cơ sở dữ liệu cũ chưa có
  try {
    const [reviewCols] = await conn.query("SHOW COLUMNS FROM Notification LIKE 'ReviewID'");
    if ((reviewCols as any[]).length === 0) {
      await conn.query(`
        ALTER TABLE Notification 
        ADD COLUMN ReviewID INT NULL,
        ADD CONSTRAINT fk_notification_review FOREIGN KEY (ReviewID) REFERENCES Review(ReviewID) ON DELETE CASCADE
      `);
      console.log('✅ Added ReviewID column and foreign key to Notification table');
    }
  } catch (errReviewCol) {
    console.error('Lỗi khi thêm cột ReviewID vào Notification:', errReviewCol);
  }

  console.log('✅ Checked/Created Notification table');

=======
import { runMigrations } from './db.migrations';
dotenv.config();

export const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASS     || '',
  database:           process.env.DB_NAME     || 'seafood_db',
  waitForConnections: true,
  connectionLimit:    10,
  charset:            'utf8mb4',
});

/**
 * Kiểm tra kết nối và chạy migrations khi khởi động.
 * Logic migrations được tách sang db.migrations.ts để dễ bảo trì.
 */
export async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✅ MySQL connected');
  await runMigrations(conn);
>>>>>>> origin/main
  conn.release();
}

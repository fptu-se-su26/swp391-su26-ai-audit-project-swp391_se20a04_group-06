const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'seafood_db',
  });

  try {
    console.log('Running migrations...');

    // 1. Thêm cột ImageURL vào bảng Review
    await pool.query(`
      ALTER TABLE Review
      ADD COLUMN ImageURL VARCHAR(500) NULL AFTER Comment
    `).catch(e => {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column ImageURL already exists in Review table.');
      } else {
        throw e;
      }
    });
    console.log('✅ Altered Review table');

    // 2. Tạo bảng Follow
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Follow (
        FollowID   INT AUTO_INCREMENT PRIMARY KEY,
        FollowerID INT NOT NULL,
        SellerID   INT NOT NULL,
        CreatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (FollowerID) REFERENCES User(UserID) ON DELETE CASCADE,
        FOREIGN KEY (SellerID)   REFERENCES User(UserID) ON DELETE CASCADE,
        UNIQUE KEY unique_follow (FollowerID, SellerID)
      )
    `);
    console.log('✅ Created Follow table');

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();

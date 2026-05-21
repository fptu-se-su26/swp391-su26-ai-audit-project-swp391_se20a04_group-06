"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'seafood_db',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
});
async function testConnection() {
    const conn = await exports.pool.getConnection();
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
      FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
      FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE
    )
  `);
    // Tự động thêm cột ProductID nếu cơ sở dữ liệu cũ chưa có
    try {
        const [cols] = await conn.query("SHOW COLUMNS FROM Notification LIKE 'ProductID'");
        if (cols.length === 0) {
            await conn.query(`
        ALTER TABLE Notification 
        ADD COLUMN ProductID INT NULL, 
        ADD CONSTRAINT fk_notification_product FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE
      `);
            console.log('✅ Added ProductID column and foreign key to Notification table');
        }
    }
    catch (errCol) {
        console.error('Lỗi khi nâng cấp bảng Notification:', errCol);
    }
    console.log('✅ Checked/Created Notification table');
    conn.release();
}

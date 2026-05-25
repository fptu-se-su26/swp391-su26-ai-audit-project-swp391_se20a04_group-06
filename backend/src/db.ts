import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
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
  conn.release();
}

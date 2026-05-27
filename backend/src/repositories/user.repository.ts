import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';

/**
 * User Repository — tập trung toàn bộ SQL liên quan đến bảng User.
 * Pattern: Repository Pattern
 *
 * BEFORE: mỗi controller tự import pool và viết SQL inline → SQL rải rác khắp nơi,
 *   khó test, khó thay đổi schema, business logic lẫn lộn với data access.
 * AFTER: mọi truy vấn User đi qua đây. Controller và Service chỉ gọi method,
 *   không cần biết SQL bên dưới.
 */

export interface UserRow extends RowDataPacket {
  UserID: number;
  Name: string;
  Phone: string;
  PasswordHash: string;
  Role: 'User' | 'Admin';
  IsActive: number;
  IsVerified: number;
  Avatar: string | null;
}

export const userRepository = {
  /** Tìm user theo số điện thoại (dùng cho login / kiểm tra trùng SĐT) */
  async findByPhone(phone: string): Promise<UserRow | null> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT UserID, Name, Phone, PasswordHash, Role, IsActive, IsVerified, Avatar FROM User WHERE Phone = ?',
      [phone],
    );
    return rows[0] ?? null;
  },

  /** Tìm user theo ID — trả về dạng camelCase cho API response */
  async findById(userId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT UserID AS id, Name AS name, Phone AS phone, Role AS role,
              IsActive AS isActive, IsVerified AS isVerified, Avatar AS avatarUrl
       FROM User WHERE UserID = ?`,
      [userId],
    );
    return rows[0] ?? null;
  },

  /** Kiểm tra số điện thoại đã tồn tại ở user khác chưa (dùng cho updateProfile) */
  async phoneExistsForOther(phone: string, excludeUserId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT UserID FROM User WHERE Phone = ? AND UserID != ?',
      [phone, excludeUserId],
    );
    return rows.length > 0;
  },

  /** Tạo user mới — trả về insertId */
  async create(name: string, phone: string, passwordHash: string): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO User (Name, Phone, PasswordHash, Role) VALUES (?, ?, ?, "User")',
      [name, phone, passwordHash],
    );
    return result.insertId;
  },

  /** Lấy tên user theo ID (dùng khi gửi notification) */
  async getNameById(userId: number): Promise<string | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT Name FROM User WHERE UserID = ?',
      [userId],
    );
    return (rows[0] as any)?.Name ?? null;
  },

  /** Cập nhật profile — chỉ update các field được truyền vào */
  async updateProfile(
    userId: number,
    fields: { name?: string; phone?: string; avatar?: string },
  ): Promise<void> {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (fields.name !== undefined) { setClauses.push('Name = ?'); params.push(fields.name); }
    if (fields.phone !== undefined) { setClauses.push('Phone = ?'); params.push(fields.phone); }
    if (fields.avatar !== undefined) { setClauses.push('Avatar = ?'); params.push(fields.avatar); }

    if (!setClauses.length) return;
    params.push(userId);
    await pool.query(`UPDATE User SET ${setClauses.join(', ')} WHERE UserID = ?`, params);
  },

  /** Lấy password hash để verify (dùng cho changePassword) */
  async getPasswordHash(userId: number): Promise<string | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT PasswordHash FROM User WHERE UserID = ?',
      [userId],
    );
    return (rows[0] as any)?.PasswordHash ?? null;
  },

  /** Cập nhật mật khẩu */
  async updatePassword(userId: number, newHash: string): Promise<void> {
    await pool.query('UPDATE User SET PasswordHash = ? WHERE UserID = ?', [newHash, userId]);
  },
};

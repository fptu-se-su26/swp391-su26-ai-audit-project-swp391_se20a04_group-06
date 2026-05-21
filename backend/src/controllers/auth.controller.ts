import 'dotenv/config';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

/* ─── POST /api/auth/register ─── */
export async function register(req: Request, res: Response) {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password)
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu' });

  if (!/^0\d{9}$/.test(phone))
    return res.status(400).json({ message: 'Số điện thoại phải là 10 số, bắt đầu bằng 0' });

  if (password.length < 6)
    return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT UserID FROM User WHERE Phone = ?', [phone],
    );
    if (rows.length > 0)
      return res.status(409).json({ message: 'Số điện thoại đã được đăng ký' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<any>(
      'INSERT INTO User (Name, Phone, PasswordHash, Role) VALUES (?, ?, ?, "User")',
      [name.trim(), phone, hash],
    );

    const userId = result.insertId;
    const token  = signToken(userId, 'User');
    return res.status(201).json({ token, user: { id: userId, name, phone, role: 'User' } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/* ─── POST /api/auth/login ─── */
export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;

  if (!phone || !password)
    return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT UserID, Name, Phone, PasswordHash, Role, IsActive FROM User WHERE Phone = ?',
      [phone],
    );
    const user = rows[0];
    if (!user)
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng' });

    if (!user.IsActive)
      return res.status(403).json({ message: 'Tài khoản đã bị khoá. Vui lòng liên hệ admin.' });

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok)
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng' });

    const token = signToken(user.UserID, user.Role);
    return res.json({
      token,
      user: { id: user.UserID, name: user.Name, phone: user.Phone, role: user.Role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/* ─── GET /api/auth/me ─── */
export async function me(req: Request, res: Response) {
  const userId = (req as any).user.userId;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT UserID as id, Name as name, Phone as phone, Role as role FROM User WHERE UserID = ?',
      [userId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/* ─── helper ─── */
function signToken(userId: number, role: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET chưa được cấu hình trong file .env');
  }
  return jwt.sign(
    { userId, role },
    secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
  );
}

import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: number;
  role: 'User' | 'Admin';
}

/* Gắn user vào req sau khi verify JWT */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

/* Chỉ cho Admin qua */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthPayload;
  if (user?.role !== 'Admin') {
    return res.status(403).json({ message: 'Chỉ Admin mới có quyền này' });
  }
  next();
}

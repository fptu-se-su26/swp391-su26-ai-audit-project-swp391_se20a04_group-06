import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

<<<<<<< HEAD
export interface AuthPayload {
  userId: number;
  role: 'User' | 'Admin';
}

=======
>>>>>>> origin/main
/* Gắn user vào req sau khi verify JWT */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });

  try {
<<<<<<< HEAD
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    (req as any).user = payload;
=======
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      role: 'User' | 'Admin';
    };
    req.user = payload;
>>>>>>> origin/main
    next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

/* Chỉ cho Admin qua */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
<<<<<<< HEAD
  const user = (req as any).user as AuthPayload;
  if (user?.role !== 'Admin') {
=======
  if (req.user?.role !== 'Admin') {
>>>>>>> origin/main
    return res.status(403).json({ message: 'Chỉ Admin mới có quyền này' });
  }
  next();
}

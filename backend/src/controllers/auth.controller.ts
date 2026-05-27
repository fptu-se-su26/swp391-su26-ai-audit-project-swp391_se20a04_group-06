import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { sendServerError } from '../helpers/response.helper';
import { AUTH_COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS } from '../config/cookie';

/**
 * Auth Controller — chỉ xử lý HTTP layer (validate input, set cookie, trả response).
 * Pattern: Thin Controller (Controller trong MVC chỉ điều phối)
 *
 * BEFORE: ~250 dòng, chứa bcrypt, jwt.sign, Cloudinary upload, SQL, cookie config.
 * AFTER:  ~90 dòng, thuần HTTP logic — parse req → gọi service → trả res.
 *
 * Đã loại bỏ:
 *   - import "dotenv/config"   (chạy ở app.ts là đủ)
 *   - cloudinary.config(...)   (chuyển sang config/cloudinary.ts Singleton)
 *   - Duplicate cookie object  (chuyển sang config/cookie.ts)
 *   - signToken()              (chuyển vào authService)
 */

export async function register(req: Request, res: Response) {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password)
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu' });
  if (!/^0\d{9}$/.test(phone))
    return res.status(400).json({ message: 'Số điện thoại phải là 10 số, bắt đầu bằng 0' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });

  try {
    const user = await authService.register(name, phone, password);
    const token = authService.signToken(user.userId, user.role);
    res.cookie('token', token, AUTH_COOKIE_OPTIONS);
    return res.status(201).json({ user });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;

  if (!phone || !password)
    return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu' });

  try {
    const user = await authService.login(phone, password);
    const token = authService.signToken(user.userId, user.role);
    res.cookie('token', token, AUTH_COOKIE_OPTIONS);
    return res.json({ user });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('token', CLEAR_COOKIE_OPTIONS);
  return res.json({ message: 'Đã đăng xuất' });
}

export async function me(req: Request, res: Response) {
  try {
    const user = await userRepository.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json(user);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function updateProfile(req: Request, res: Response) {
  const { userId } = req.user;
  const { name, phone } = req.body;

  if (!name || typeof name !== 'string' || !name.trim())
    return res.status(400).json({ message: 'Tên không được để trống' });

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100)
    return res.status(400).json({ message: 'Tên phải từ 2 đến 100 ký tự' });

  if (phone && !/^0\d{9}$/.test(phone))
    return res.status(400).json({ message: 'Số điện thoại phải là 10 số, bắt đầu bằng 0' });

  try {
    const result = await authService.updateProfile(userId, {
      name: trimmed,
      phone,
      fileBuffer: req.file?.buffer,
    });
    return res.json({ message: 'Cập nhật tài khoản thành công', ...result });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function changePassword(req: Request, res: Response) {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
  if (newPassword.length < 6)
    return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự' });
  if (currentPassword === newPassword)
    return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại' });

  try {
    await authService.changePassword(userId, currentPassword, newPassword);
    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

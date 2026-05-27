import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";
import { userRepository } from "../repositories/user.repository";
import { sendServerError } from "../helpers/response.helper";
import { AUTH_COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS } from "../config/cookie";

export async function register(req: Request, res: Response) {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password)
    return res.status(400).json({
      message: "Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu",
    });
  if (!/^0\d{9}$/.test(phone))
    return res
      .status(400)
      .json({ message: "Số điện thoại phải là 10 số, bắt đầu bằng 0" });
  if (password.length < 6)
    return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

  try {
    const user = await authService.register(name, phone, password);
    const token = authService.signToken(user.userId, user.role);
    res.cookie("token", token, AUTH_COOKIE_OPTIONS);
    return res.status(201).json({ user });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;

  if (!phone || !password)
    return res
      .status(400)
      .json({ message: "Vui lòng nhập số điện thoại và mật khẩu" });

  try {
    const user = await authService.login(phone, password);
    const token = authService.signToken(user.userId, user.role);
    res.cookie("token", token, AUTH_COOKIE_OPTIONS);
    return res.json({ user });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
  return res.json({ message: "Đã đăng xuất" });
}

/**
 * FIX: me() không dùng authenticate middleware nữa.
 * Tự đọc token từ cookie và trả về:
 *   - 200 + null   → chưa đăng nhập (không gây lỗi đỏ trong browser console)
 *   - 200 + user   → đã đăng nhập
 *
 * TRƯỚC: GET /auth/me dùng authenticate → trả 401 khi chưa login
 *        → browser hiển thị lỗi đỏ dù frontend đã catch() xử lý đúng.
 * SAU:   Luôn trả 200, frontend phân biệt bằng giá trị null vs object.
 */
export async function me(req: Request, res: Response) {
  const token = req.cookies?.token;

  // Chưa đăng nhập → trả null, không phải lỗi
  if (!token) return res.json(null);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      role: "User" | "Admin";
    };
    const user = await userRepository.findById(payload.userId);
    return res.json(user ?? null);
  } catch {
    // Token hết hạn hoặc không hợp lệ → xóa cookie rác và trả null
    res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
    return res.json(null);
  }
}

export async function updateProfile(req: Request, res: Response) {
  const { userId } = req.user;
  const { name, phone } = req.body;

  if (!name || typeof name !== "string" || !name.trim())
    return res.status(400).json({ message: "Tên không được để trống" });

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100)
    return res.status(400).json({ message: "Tên phải từ 2 đến 100 ký tự" });

  if (phone && !/^0\d{9}$/.test(phone))
    return res
      .status(400)
      .json({ message: "Số điện thoại phải là 10 số, bắt đầu bằng 0" });

  try {
    const result = await authService.updateProfile(userId, {
      name: trimmed,
      phone,
      fileBuffer: req.file?.buffer,
    });
    return res.json({ message: "Cập nhật tài khoản thành công", ...result });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function changePassword(req: Request, res: Response) {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" });
  if (newPassword.length < 6)
    return res.status(400).json({ message: "Mật khẩu mới tối thiểu 6 ký tự" });
  if (currentPassword === newPassword)
    return res
      .status(400)
      .json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });

  try {
    await authService.changePassword(userId, currentPassword, newPassword);
    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

import "dotenv/config";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { pool } from "../db";
import { RowDataPacket } from "mysql2";
import { sendServerError } from "../helpers/response.helper";
import { v2 as cloudinary } from "cloudinary"; // ✅ BỔ SUNG: Import Cloudinary SDK

// Đảm bảo cấu hình Cloudinary chạy chính xác bằng các biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ─── POST /api/auth/register ─── */
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
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT UserID FROM User WHERE Phone = ?",
      [phone],
    );

    if (rows.length > 0)
      return res.status(409).json({
        message: "Số điện thoại đã được đăng ký",
      });

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query<any>(
      'INSERT INTO User (Name, Phone, PasswordHash, Role) VALUES (?, ?, ?, "User")',
      [name.trim(), phone, hash],
    );

    const userId = result.insertId;

    // Tạo JWT
    const token = signToken(userId, "User");

    // Lưu token vào cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    // KHÔNG trả token nữa
    return res.status(201).json({
      user: {
        id: userId,
        name,
        phone,
        role: "User",
        isVerified: false,
        avatarUrl: null,
      },
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Đã đăng xuất" });
}

/* ─── POST /api/auth/login ─── */
export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;

  if (!phone || !password)
    return res
      .status(400)
      .json({ message: "Vui lòng nhập số điện thoại và mật khẩu" });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT UserID, Name, Phone, PasswordHash, Role, IsActive, IsVerified, Avatar FROM User WHERE Phone = ?",
      [phone],
    );
    const user = rows[0];
    if (!user)
      return res
        .status(401)
        .json({ message: "Số điện thoại hoặc mật khẩu không đúng" });

    if (!user.IsActive)
      return res
        .status(403)
        .json({ message: "Tài khoản đã bị khoá. Vui lòng liên hệ admin." });

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok)
      return res
        .status(401)
        .json({ message: "Số điện thoại hoặc mật khẩu không đúng" });

    const token = signToken(user.UserID, user.Role);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // chỉ gửi qua HTTPS khi production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    return res.json({
      user: {
        id: user.UserID,
        name: user.Name,
        phone: user.Phone,
        role: user.Role,
        isVerified: !!user.IsVerified,
        avatarUrl: user.Avatar,
      },
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── GET /api/auth/me ─── */
export async function me(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT UserID as id, Name as name, Phone as phone, Role as role, IsActive as isActive, IsVerified as isVerified, Avatar as avatarUrl FROM User WHERE UserID = ?",
      [userId],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.json(rows[0]);
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── PUT /api/auth/profile ─── (Tối ưu hóa ghi đè ảnh đại diện mượt mà) */
export async function updateProfile(req: Request, res: Response) {
  const { userId } = req.user;
  const { name, phone } = req.body;

  if (!name || typeof name !== "string" || !name.trim())
    return res.status(400).json({ message: "Tên không được để trống" });

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100)
    return res.status(400).json({ message: "Tên phải từ 2 đến 100 ký tự" });

  if (phone && !/^0\d{9}$/.test(phone)) {
    return res
      .status(400)
      .json({ message: "Số điện thoại phải là 10 số, bắt đầu bằng 0" });
  }

  try {
    const fieldsToUpdate: string[] = [];
    const queryParams: any[] = [];

    // Luôn cập nhật name nếu có truyền và hợp lệ
    fieldsToUpdate.push("Name = ?");
    queryParams.push(trimmed);

    // Chỉ cập nhật Phone nếu Frontend có truyền giá trị mới lên
    if (phone !== undefined) {
      // Kiểm tra trùng lặp số điện thoại
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT UserID FROM User WHERE Phone = ? AND UserID != ?",
        [phone, userId],
      );
      if (rows.length > 0) {
        return res
          .status(409)
          .json({ message: "Số điện thoại đã được người khác đăng ký" });
      }
      fieldsToUpdate.push("Phone = ?");
      queryParams.push(phone);
    }

    // Xử lý upload Cloudinary nếu có file
    let avatarUrl = null;
    if (req.file) {
      try {
        const uploadResult: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "avatars" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            },
          );
          stream.end(req.file.buffer);
        });
        avatarUrl = uploadResult.secure_url || uploadResult.url;

        fieldsToUpdate.push("Avatar = ?");
        queryParams.push(avatarUrl);
      } catch (uploadErr) {
        console.error("Lỗi upload Cloudinary thất bại:", uploadErr);
        return res.status(500).json({ message: "Lỗi tải ảnh lên Cloudinary" });
      }
    }

    // Thêm userId vào cuối danh sách params cho mệnh đề WHERE
    queryParams.push(userId);

    // Ghép câu lệnh SQL động
    const sql = `UPDATE User SET ${fieldsToUpdate.join(", ")} WHERE UserID = ?`;
    await pool.query(sql, queryParams);

    return res.json({
      message: "Cập nhật tài khoản thành công",
      name: trimmed,
      phone: phone !== undefined ? phone : undefined,
      avatarUrl: avatarUrl || undefined,
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── POST /api/auth/change-password ─── */
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
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT PasswordHash FROM User WHERE UserID = ?",
      [userId],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const ok = await bcrypt.compare(currentPassword, rows[0].PasswordHash);
    if (!ok)
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE User SET PasswordHash = ? WHERE UserID = ?", [
      hash,
      userId,
    ]);
    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── helper ─── */
function signToken(userId: number, role: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET chưa được cấu hình trong file .env");
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, role }, secret, options);
}

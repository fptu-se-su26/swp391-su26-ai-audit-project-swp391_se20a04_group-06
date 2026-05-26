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
      return res.status(409).json({ message: "Số điện thoại đã được đăng ký" });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<any>(
      'INSERT INTO User (Name, Phone, PasswordHash, Role) VALUES (?, ?, ?, "User")',
      [name.trim(), phone, hash],
    );

    const userId = result.insertId;
    const token = signToken(userId, "User");
    return res.status(201).json({
      token,
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
    return res.json({
      token,
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
    // 1. Kiểm tra số điện thoại mới có bị trùng lặp với tài khoản khác không
    if (phone) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT UserID FROM User WHERE Phone = ? AND UserID != ?",
        [phone, userId],
      );
      if (rows.length > 0) {
        return res
          .status(409)
          .json({ message: "Số điện thoại đã được người khác đăng ký" });
      }
    }

    // 2. Chuyển đổi dữ liệu nhị phân (Buffer) và truyền thẳng lên Cloudinary
    let avatarUrl = null;
    if (req.file) {
      try {
        const uploadResult: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "avatars" }, // Lưu vào thư mục "avatars" trên Cloudinary
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            },
          );
          stream.end(req.file.buffer); // Đổ dữ liệu buffer nhị phân vào luồng truyền
        });

        // Nhận về URL ảnh an toàn từ Cloudinary
        avatarUrl = uploadResult.secure_url || uploadResult.url;
      } catch (uploadErr) {
        console.error("Lỗi upload Cloudinary thất bại:", uploadErr);
        return res.status(500).json({ message: "Lỗi tải ảnh lên Cloudinary" });
      }
    }

    // 3. Tiến hành cập nhật Database bằng câu lệnh có điều kiện
    if (avatarUrl) {
      await pool.query(
        "UPDATE User SET Name = ?, Phone = ?, Avatar = ? WHERE UserID = ?",
        [trimmed, phone, avatarUrl, userId],
      );
    } else {
      await pool.query("UPDATE User SET Name = ?, Phone = ? WHERE UserID = ?", [
        trimmed,
        phone,
        userId,
      ]);
    }

    // Lấy lại Avatar URL mới nhất từ Database để trả về chính xác cho Frontend
    const [updatedUser] = await pool.query<RowDataPacket[]>(
      "SELECT Avatar FROM User WHERE UserID = ?",
      [userId],
    );
    const finalAvatarUrl = updatedUser[0]?.Avatar || null;

    return res.json({
      message: "Cập nhật tài khoản thành công",
      name: trimmed,
      phone,
      avatarUrl: finalAvatarUrl,
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

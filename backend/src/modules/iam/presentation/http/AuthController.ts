// Import kiểu dữ liệu Request và Response từ Express để định nghĩa kiểu cho tham số đầu vào
import { Request, Response } from "express";
// Import thư viện jsonwebtoken để mã hóa và giải mã các thẻ Token JWT
import jwt, { SignOptions } from "jsonwebtoken";
// Import thư viện mã hóa crypto có sẵn của Node.js để sinh chuỗi ngẫu nhiên bảo mật
import crypto from "crypto";
// Import logger dùng chung của dự án để ghi nhận tiến trình hoạt động
import { logger } from "../../../../utils/logger";
// Import cấu hình cookie lưu trữ tùy chỉnh cho việc phân phối JWT Token
import { AUTH_COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS } from "../../../../config/cookie";
// Import middleware sinh và làm mới CSRF token để phòng chống lỗ hổng bảo mật CSRF
import { rotateCsrfToken } from "../../../../middlewares/csrf";

// DDD Components - Import các Repository, Service và Use Cases nghiệp vụ
import { MongooseUserRepository } from "../../infrastructure/persistence/mongoose/MongooseUserRepository";
import { CloudinaryImageUploader } from "../../infrastructure/external-services/CloudinaryImageUploader";
import { UpdateProfileUseCase } from "../../application/use-cases/UpdateProfileUseCase";
import { DeleteAccountUseCase } from "../../application/use-cases/DeleteAccountUseCase";
import { GoogleAuthUseCase } from "../../application/use-cases/GoogleAuthUseCase";

// Cấu hình cookie cho Access Token (Lưu trữ ngắn hạn: 15 phút)
const ACCESS_COOKIE_OPTS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 phút đổi ra mili-giây
};

// Cấu hình cookie cho Refresh Token (Lưu trữ dài hạn: 7 ngày)
const REFRESH_COOKIE_OPTS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày đổi ra mili-giây
};

// Đọc kết nối redis đã được cấu hình từ trước trong hệ thống
const redis = require("../../../../config/redis").redis;

// Hàm tiện ích để ký (tạo mới) Access Token mã hóa chứa ID người dùng và Quyền (Role)
function signToken(userId: string, role: string): string {
  const secret = process.env.JWT_SECRET; // Đọc khóa bí mật JWT_SECRET từ biến môi trường .env
  if (!secret) throw new Error("JWT_SECRET chưa được cấu hình");
  const options: SignOptions = { expiresIn: "15m" }; // Cấu hình thời gian hết hạn của token là 15 phút
  return jwt.sign({ userId, role }, secret, options); // Trả về chuỗi JWT đã ký
}

// Khởi tạo các Adapter hạ tầng (Infrastructure) duy nhất một lần
const userRepository = new MongooseUserRepository(); // Khởi tạo Repository quản lý DB người dùng
const imageUploader = new CloudinaryImageUploader(); // Khởi tạo Service tải ảnh lên Cloudinary

// Khởi tạo các Use Cases nghiệp vụ (Application Layer)
const updateProfileUseCase = new UpdateProfileUseCase(userRepository, imageUploader);
const deleteAccountUseCase = new DeleteAccountUseCase(userRepository);
const googleAuthUseCase = new GoogleAuthUseCase(userRepository);

// HÀM XỬ LÝ ĐĂNG XUẤT TÀI KHOẢN (LOGOUT)
export async function logout(req: Request, res: Response, next: any) {
  const oldRefreshToken = req.cookies?.refreshToken; // Đọc Refresh Token hiện tại từ Cookie gửi lên
  const token = req.cookies?.token; // Đọc Access Token hiện tại từ Cookie gửi lên

  // Nếu người dùng đang có Refresh Token, thực hiện thu hồi nó trong Redis Cache để tránh bị lợi dụng
  if (oldRefreshToken) {
    let userId: string | null = null;
    if (token) {
      try {
        // Giải mã Access Token nhưng bỏ qua kiểm tra hết hạn (đăng xuất thì token hết hạn vẫn cho phép thu hồi)
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
          ignoreExpiration: true,
        }) as { userId: string } | null;
        userId = decoded?.userId || null; // Lấy ID người dùng
      } catch (err) {}
    }
    try {
      if (userId) {
        // Xóa key lưu trữ token tương ứng trong Redis DB
        await redis.del(`auth:refresh:${userId}:${oldRefreshToken}`);
        logger.info(`Tokens revoked in Redis on logout for UserID=${userId}`);
      }
    } catch (err: any) {
      logger.error(`Token revocation error in Redis on logout: ${err.message}`);
    }
  }

  // Xóa bỏ tất cả các cookie đã cấp phát cho trình duyệt
  res.clearCookie("token", CLEAR_COOKIE_OPTIONS); // Xóa cookie Access Token
  res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS); // Xóa cookie Refresh Token
  res.clearCookie("csrfToken", { // Xóa cookie CSRF Token
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.json({ message: "Đã đăng xuất thành công!" }); // Trả về phản hồi thành công dạng JSON
}

// HÀM XỬ LÝ XÓA VĨNH VIỄN TÀI KHOẢN (GDPR DELETE ACCOUNT)
export async function deleteAccount(req: Request, res: Response, next: any) {
  const { userId } = req.user; // Lấy userId đã được đính kèm vào req sau khi đi qua middleware kiểm tra đăng nhập (Auth Middleware)
  try {
    // Gọi UseCase xóa vĩnh viễn tài khoản và các dữ liệu liên quan ở tầng Application
    await deleteAccountUseCase.execute(userId);

    // Xóa sạch Cookie trên trình duyệt của người dùng sau khi xóa tài khoản
    res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
    res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
    res.clearCookie("csrfToken", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info(`GDPR: User account deleted permanently: ID=${userId}`);
    return res.json({
      message: "Tài khoản và toàn bộ dữ liệu của bạn đã được xóa vĩnh viễn thành công.",
    });
  } catch (err: any) {
    next(err); // Ném lỗi cho Express Global Error Handler xử lý
  }
}

// HÀM XỬ LÝ CẬP NHẬT HỒ SƠ CÁ NHÂN (UPDATE PROFILE)
export async function updateProfile(req: Request, res: Response, next: any) {
  const { userId } = req.user; // Lấy ID của người dùng hiện tại
  const { name, email } = req.body; // Lấy họ tên mới và email mới từ dữ liệu JSON gửi lên

  try {
    // Thực thi nghiệp vụ cập nhật hồ sơ thông qua UseCase
    const result = await updateProfileUseCase.execute(userId, {
      name: name.trim(), // Xóa bỏ các ký tự khoảng trắng thừa ở đầu/cuối tên
      email,
      fileBuffer: req.file?.buffer, // Nếu người dùng tải lên ảnh avatar mới (qua Multer), truyền bộ đệm file (Buffer) vào
    });
    logger.info(`Profile updated for UserID=${userId}`);
    return res.json({ message: "Cập nhật tài khoản thành công", ...result }); // Trả về thông tin hồ sơ mới cập nhật
  } catch (err: any) {
    next(err); // Ném lỗi cho Middleware xử lý lỗi tập trung
  }
}

// HÀM XỬ LÝ TRUY VẤN THÔNG TIN TÀI KHOẢN ĐANG ĐĂNG NHẬP (GET CURRENT USER INFO)
export async function me(req: Request, res: Response, next: any) {
  const token = req.cookies?.token; // Lấy Access Token từ Cookie
  if (!token) return res.status(401).json({ message: "Chưa đăng nhập" }); // Trả về mã lỗi 401 nếu thiếu token

  try {
    // Xác thực chữ ký token, nếu không khớp hoặc đã quá hạn sẽ tự động nhảy vào khối catch
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: "User" | "Admin";
    };
    
    // Tìm thực thể Domain User từ Database bằng ID giải mã được
    const domainUser = await userRepository.findById(payload.userId);
    if (!domainUser) return res.json(null); // Trả về null nếu không tìm thấy người dùng
    
    const props = domainUser.toProps(); // Trích xuất các thuộc tính thô từ thực thể Domain
    // Đóng gói và gửi trả thông tin cần thiết về phía Client
    return res.json({
      id: props.id,
      name: props.name,
      email: props.email,
      role: props.role,
      isActive: props.isActive,
      isVerified: props.isVerified,
      avatarUrl: props.avatar,
      isPremium: props.isPremium,
      badges: props.badges,
    });
  } catch (err: any) {
    logger.warn(`Invalid access token provided: ${err.message}`);
    return res.status(401).json({ message: "Access Token hết hạn" }); // Trả về lỗi hết hạn token
  }
}

// HÀM XỬ LÝ LÀM MỚI ACCESS TOKEN TỰ ĐỘNG (SILENT REFRESH TOKEN)
export async function refreshToken(req: Request, res: Response, next: any) {
  const oldRefreshToken = req.cookies?.refreshToken; // Lấy Refresh Token hiện tại từ Cookie dài hạn
  const token = req.cookies?.token; // Lấy Access Token đã hết hạn từ Cookie ngắn hạn

  // Đảm bảo phải có đủ cả 2 token thì mới được quyền làm mới phiên
  if (!oldRefreshToken || !token) {
    return res.status(401).json({ message: "Phiên làm việc hết hạn" });
  }

  try {
    let decoded: { userId: string; role: string };
    try {
      // Giải mã Access Token nhưng bỏ qua việc kiểm tra hết hạn (vì chắc chắn nó đã hết hạn thì mới cần gọi làm mới)
      decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
        ignoreExpiration: true,
      }) as { userId: string; role: string };
    } catch (verifyErr: any) {
      logger.warn(`refreshToken: invalid signature — ${verifyErr.message}`);
      // Nếu chữ ký Access Token bị lỗi (giả mạo token), lập tức xóa sạch cookie để bắt người dùng đăng nhập lại
      res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
      res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    if (!decoded?.userId) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // Định nghĩa khóa Redis tương ứng để kiểm tra sự tồn tại của Refresh Token này
    const redisKey = `auth:refresh:${decoded.userId}:${oldRefreshToken}`;
    const tokenExists = await redis.exists(redisKey); // Truy xuất kiểm tra sự tồn tại của key trong Redis

    // PHÒNG CHỐNG TẤN CÔNG REPLAY ATTACK (GIẢ MẠO TOKEN CŨ ĐÃ HẾT HẠN):
    // Nếu token gửi lên hợp lệ nhưng KHÔNG CÒN TỒN TẠI trong Redis, chứng tỏ token này đã được dùng 1 lần trước đó và bị xóa.
    // Đây là dấu hiệu của việc tin tặc trộm được Refresh Token cũ để cố gắng làm mới phiên.
    if (!tokenExists) {
      let cursor = "0";
      const keys: string[] = [];
      // Quét (SCAN) toàn bộ các khóa refresh token của người dùng này đang lưu trong Redis
      do {
        const reply = await redis.scan(
          cursor,
          "MATCH",
          `auth:refresh:${decoded.userId}:*`,
          "COUNT",
          100
        );
        cursor = reply[0]; // Cập nhật lại con trỏ quét tiếp theo
        keys.push(...reply[1]); // Gom các key tìm thấy vào mảng
      } while (cursor !== "0"); // Dừng quét khi con trỏ quét quay về "0"

      // Để đảm bảo an toàn tối đa cho chủ sở hữu tài khoản, lập tức hủy bỏ (xóa) toàn bộ phiên đăng nhập đang hoạt động của User này
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      // Xóa cookies phía client
      res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
      res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
      logger.warn(`Potential token reuse detected. Revoking all tokens safely for UserID=${decoded.userId}`);
      return res.status(403).json({
        message: "Phát hiện Token đã qua sử dụng. Vui lòng đăng nhập lại để đảm bảo an toàn.",
      });
    }

    // Xóa khóa Refresh Token cũ khỏi Redis sau khi xác minh (Single-use token rotation)
    await redis.del(redisKey);

    // Ký Access Token mới chứa thông tin ID người dùng và quyền hạn
    const newAccessToken = signToken(decoded.userId, decoded.role);
    // Sinh Refresh Token mới ngẫu nhiên dài 40 bytes dưới dạng chuỗi hexa
    const newRefreshToken = crypto.randomBytes(40).toString("hex");

    // Lưu trữ Refresh Token mới vào Redis với thời gian hết hạn là 7 ngày (7 * 24 * 3600 giây)
    await redis.set(
      `auth:refresh:${decoded.userId}:${newRefreshToken}`,
      "1",
      "EX",
      7 * 24 * 3600
    );

    // Gửi cặp token mới trả về phía trình duyệt dưới dạng cookies HttpOnly bảo mật
    res.cookie("token", newAccessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTS);
    // Làm mới mã CSRF token mới để tăng cường bảo mật cho phiên tiếp theo
    rotateCsrfToken(res);

    return res.json({ status: "refreshed" }); // Trả về phản hồi đã làm mới token thành công
  } catch (err: any) {
    logger.error(`Token refresh failed: ${err.message}`);
    return res.status(401).json({ message: "Lỗi xác thực lại" });
  }
}

// HÀM XỬ LÝ ĐĂNG NHẬP GOOGLE OAUTH
export async function googleAuth(req: Request, res: Response, next: any) {
  const { idToken } = req.body; // Đọc mã idToken từ yêu cầu gửi lên của Client

  if (!idToken) {
    return res.status(400).json({ message: "Thiếu ID Token bảo mật từ Google" }); // Trả về lỗi 400 nếu trống token
  }

  try {
    // Gọi UseCase xử lý đăng nhập Google ở tầng nghiệp vụ và lấy thông tin người dùng sạch
    const authResult = await googleAuthUseCase.execute(idToken);

    // Ký Access Token mới từ thông tin đăng nhập thành công
    const accessToken = signToken(authResult.userId, authResult.role);
    // Sinh Refresh Token dài hạn ngẫu nhiên
    const refreshToken = crypto.randomBytes(40).toString("hex");

    // Lưu trữ thông tin Refresh Token vào Redis DB
    await redis.set(
      `auth:refresh:${authResult.userId}:${refreshToken}`,
      "1",
      "EX",
      7 * 24 * 3600
    );

    // Thiết lập cookies chứa token gửi ngược lại trình duyệt
    res.cookie("token", accessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

    return res.json({ user: authResult }); // Trả về thông tin người dùng dạng JSON
  } catch (err: any) {
    next(err); // Đẩy lỗi sang Global Error Handler để đóng gói JSON trả về Client
  }
}

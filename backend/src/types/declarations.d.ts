// Import lớp dòng đọc dữ liệu Readable từ thư viện stream có sẵn của Node.js
import { Readable } from "stream";

// Khai báo kiểu dữ liệu cho module ngoài "streamifier" để TypeScript hiểu và biên dịch không báo lỗi
declare module "streamifier" {
  // Xuất ra hàm createReadStream tạo dòng đọc từ dữ liệu Buffer hoặc chuỗi string
  export function createReadStream(
    // Dữ liệu đầu vào có thể là một Buffer nhị phân hoặc chuỗi văn bản
    buffer: Buffer | string,
    // Các tùy chọn bổ sung đi kèm (không bắt buộc)
    options?: any,
    // Kết quả trả về là một dòng đọc Readable Stream
  ): Readable;
}

// Mở rộng thuộc tính Express Request một cách toàn cục (Global) để có thể truy xuất trong toàn dự án
declare global {
  // Sử dụng namespace Express có sẵn của thư viện Express
  namespace Express {
    // Khai báo bổ sung thuộc tính cho giao diện Request của Express
    interface Request {
      // Thuộc tính user lưu thông tin tài khoản đã xác thực thông qua middleware
      user: {
        // ID tài khoản người dùng dưới dạng chuỗi
        userId: string;
        // Vai trò của người dùng trong hệ thống (chỉ chấp nhận "User" hoặc "Admin")
        role: "User" | "Admin";
        // Chế độ phiên hiện tại do người dùng chọn khi đăng nhập.
        sessionRole?: "buyer" | "seller";
        isVerified?: boolean;
        isPremium?: boolean;
      };
      // Thuộc tính csrfToken tùy chọn dùng để xác minh chống tấn công giả mạo yêu cầu CSRF
      csrfToken?: string;
    }
  }
}

// Xuất khẩu đối tượng trống để đánh dấu file này là một module độc lập trong TypeScript
export {};

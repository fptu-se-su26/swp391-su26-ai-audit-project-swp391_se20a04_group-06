// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ tài khoản người dùng
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IUser mở rộng từ Document của Mongoose cho tài liệu người dùng (User Document)
export interface IUser extends Document {
  // Tên hiển thị cá nhân của tài khoản người dùng
  name: string;
  // Địa chỉ thư điện tử duy nhất dùng để đăng nhập và nhận thông báo
  email: string;
  // Chuỗi mã hóa hash bảo mật của mật khẩu người dùng
  passwordHash: string;
  // Vai trò phân quyền trong hệ thống: Người dùng thông thường (User) hoặc Quản trị viên (Admin)
  role: "User" | "Admin";
  // Trạng thái tài khoản: đang hoạt động (true) hoặc đã bị khóa/tạm dừng (false)
  isActive: boolean;
  // Trạng thái chứng thực ngư dân hoặc độ tin cậy của tài khoản
  isVerified: boolean;
  // Đường dẫn ảnh đại diện cá nhân (có thể null)
  avatar: string | null;
  // Mảng chứa các ID sản phẩm hải sản mà người dùng đã thích thả tim (liên kết bảng Product)
  favorites: Types.ObjectId[];
  // Mảng chứa các ID những người dùng (ngư dân khác) mà người này đang theo dõi (liên kết bảng User)
  following: Types.ObjectId[];
  // Trạng thái thành viên đăng ký Premium (nhận đặc quyền đăng tin và huy hiệu nổi bật)
  isPremium: boolean;
  // Mảng lưu danh hiệu/huy hiệu người dùng đạt được (ví dụ: "Sellers", "Top-rated"...) (không bắt buộc)
  badges?: string[];
  isGoogleLinked?: boolean;
  // Mốc thời gian tự động tạo tài khoản trong DB
  createdAt: Date;
  // Mốc thời gian tự động cập nhật tài khoản trong DB
  updatedAt: Date;
}

// Khởi tạo lược đồ userSchema dành cho bộ sưu tập User
const userSchema = new Schema<IUser>(
  {
    // Cấu hình trường name: kiểu chuỗi, bắt buộc nhập và tự động loại bỏ khoảng trắng dư ở đầu/cuối (trim)
    name: { type: String, required: true, trim: true },
    // Cấu hình trường email: kiểu chuỗi, bắt buộc nhập, giá trị là duy nhất (unique), tự động viết thường (lowercase), trim và đánh chỉ mục index
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    // Cấu hình trường passwordHash: kiểu chuỗi và bắt buộc nhập
    passwordHash: { type: String, required: true },
    // Cấu hình trường role: kiểu chuỗi, chỉ nhận giá trị enum và mặc định là "User"
    role: { type: String, enum: ["User", "Admin"], default: "User" },
    // Cấu hình trường isActive: kiểu boolean, mặc định tài khoản mới tạo được kích hoạt hoạt động
    isActive: { type: Boolean, default: true },
    // Cấu hình trường isVerified: kiểu boolean, mặc định tài khoản mới chưa được xác minh
    isVerified: { type: Boolean, default: false },
    // Cấu hình trường avatar: kiểu chuỗi đường dẫn ảnh, mặc định là null
    avatar: { type: String, default: null },
    // Cấu hình trường favorites: mảng chứa các ObjectId tham chiếu đến bảng Product
    favorites: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    // Cấu hình trường following: mảng chứa các ObjectId tham chiếu đến chính bộ sưu tập User
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Cấu hình trường isPremium: kiểu boolean, mặc định là tài khoản thường (false)
    isPremium: { type: Boolean, default: false },
    // Cấu hình trường isGoogleLinked: kiểu boolean, mặc định là false
    isGoogleLinked: { type: Boolean, default: false },
    // Cấu hình trường badges: mảng chứa danh sách danh hiệu dạng chuỗi
    badges: [{ type: String }],
  },
  // Kích hoạt timestamps tự động theo dõi thời gian tạo và cập nhật tài khoản người dùng
  { timestamps: true },
);

// Đánh chỉ mục index cho trường following để tăng tốc độ truy vấn danh sách người theo dõi
userSchema.index({ following: 1 });
// Đánh chỉ mục index cho trường favorites để tăng tốc độ truy vấn danh sách sản phẩm yêu thích
userSchema.index({ favorites: 1 });

// Tạo và xuất ra mô hình User
export const User = model<IUser>("User", userSchema);

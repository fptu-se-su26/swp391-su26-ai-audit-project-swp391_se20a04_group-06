// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ bài viết diễn đàn
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IComment đại diện cho cấu trúc của một bình luận dưới bài viết
export interface IComment {
  // Mã ID của người bình luận (kiểu ObjectId liên kết bảng User)
  userId: Types.ObjectId;
  // Tên hiển thị người bình luận
  userName: string;
  // Ảnh đại diện của người bình luận (có thể null)
  userAvatar: string | null;
  // Nội dung văn bản bình luận
  text: string;
  // Thời điểm bình luận được viết
  createdAt: Date;
}

// Định nghĩa giao diện IPost mở rộng từ Document của Mongoose cho tài liệu bài viết (Post Document)
export interface IPost extends Document {
  // Mã ID của tác giả bài đăng (kiểu ObjectId liên kết bảng User)
  userId: Types.ObjectId;
  // Tên hiển thị của tác giả bài viết
  userName: string;
  // Ảnh đại diện của tác giả bài viết (có thể null)
  userAvatar: string | null;
  // Tiêu đề bài đăng
  title: string;
  // Nội dung chi tiết bài viết
  content: string;
  // Mảng chứa danh sách hình ảnh đính kèm
  images: string[];
  // Mảng chứa ID những người dùng thích bài viết (liên kết bảng User)
  likes: Types.ObjectId[];
  // Mảng chứa danh sách các tài liệu con bình luận
  comments: IComment[];
  // Mảng chứa các nhãn từ khóa phân loại bài viết
  tags: string[];
  // Tổng số lượt xem bài viết
  viewCount: number;
  // Mốc thời gian tự động tạo bài viết trong DB
  createdAt: Date;
  // Mốc thời gian tự động cập nhật bài viết trong DB
  updatedAt: Date;
}

// Khởi tạo lược đồ postSchema dành cho bộ sưu tập Post
const postSchema = new Schema<IPost>(
  {
    // Cấu hình trường userId: liên kết với bộ sưu tập User, bắt buộc nhập và đánh index để truy vấn theo tác giả nhanh hơn
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Cấu hình trường userName: kiểu chuỗi và bắt buộc nhập
    userName: { type: String, required: true },
    // Cấu hình trường userAvatar: kiểu chuỗi và mặc định bằng null
    userAvatar: { type: String, default: null },
    // Cấu hình trường title: kiểu chuỗi, bắt buộc nhập và tự động loại bỏ khoảng trắng hai đầu (trim)
    title: { type: String, required: true, trim: true },
    // Cấu hình trường content: kiểu chuỗi và bắt buộc nhập
    content: { type: String, required: true },
    // Cấu hình trường images: mảng chứa các đường dẫn hình ảnh dạng chuỗi
    images: [{ type: String }],
    // Cấu hình trường likes: mảng các ObjectId tham chiếu đến bảng User
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Cấu hình trường comments: chứa mảng các đối tượng tài liệu con (Subdocument) bình luận
    comments: [
      {
        // ID người bình luận: liên kết User, bắt buộc nhập
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        // Tên hiển thị người bình luận: bắt buộc nhập
        userName: { type: String, required: true },
        // Ảnh đại diện người bình luận
        userAvatar: { type: String, default: null },
        // Nội dung bình luận: bắt buộc nhập
        text: { type: String, required: true },
        // Mốc thời gian tạo bình luận: mặc định lấy thời gian hiện tại
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Cấu hình trường tags: mảng các từ khóa phân loại dạng chuỗi
    tags: [{ type: String }],
    // Cấu hình trường viewCount: kiểu số đại diện lượt xem, mặc định bằng 0
    viewCount: { type: Number, default: 0 },
  },
  // Kích hoạt tính năng timestamps tự động theo dõi thời gian tạo và cập nhật bài viết
  { timestamps: true },
);

// Đánh chỉ mục index phức hợp theo userId tăng dần và createdAt giảm dần để tối ưu hóa việc tải bài viết mới nhất của một tác giả cụ thể
postSchema.index({ userId: 1, createdAt: -1 });
// Đánh chỉ mục tìm kiếm văn bản (Text Index) trên hai trường title và content để hỗ trợ tính năng tìm kiếm bài viết toàn văn bản (Full-Text Search)
postSchema.index({ title: "text", content: "text" });

// Tạo và xuất ra mô hình Post
export const Post = model<IPost>("Post", postSchema);

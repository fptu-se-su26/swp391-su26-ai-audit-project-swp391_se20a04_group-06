// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ công thức nấu ăn
import { Schema, model, Document, Types } from "mongoose";

export interface IRecipeComment {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: Date;
}

// Định nghĩa giao diện IRecipe mở rộng từ Document của Mongoose cho tài liệu công thức nấu ăn (Recipe Document)
export interface IRecipe extends Document {
  // Tiêu đề của công thức nấu ăn
  title: string;
  // Nội dung mô tả chi tiết công thức nấu ăn
  description: string;
  // Mảng chứa danh sách các nguyên liệu cần chuẩn bị
  ingredients: string[];
  // Mảng chứa các bước hướng dẫn nấu ăn cụ thể
  instructions: string[];
  // Đường dẫn hình ảnh thành phẩm món ăn (có thể null)
  imageUrl: string | null;
  // Mã ID của tác giả đăng tải công thức này (kiểu ObjectId liên kết bảng User)
  authorId: Types.ObjectId;
  // Cấp độ khó của món ăn: Dễ (Easy), Trung bình (Medium), hoặc Khó (Hard)
  difficulty: "Easy" | "Medium" | "Hard";
  // Thời gian chuẩn bị và chế biến món ăn (đơn vị: phút)
  cookingTime: number;
  // Số khẩu phần ăn phục vụ (ví dụ: cho 2 người, 4 người ăn)
  servings: number;
  // Mảng chứa các nhãn từ khóa nhãn dán liên quan
  tags: string[];
  // Mảng chứa ID những người dùng đã thích công thức này (liên kết bảng User)
  likes: Types.ObjectId[];
  comments: IRecipeComment[];
  // Tổng số lượt xem chi tiết công thức
  viewCount: number;
  // Mốc thời gian tự động tạo tài liệu trong DB
  createdAt: Date;
  // Mốc thời gian tự động cập nhật tài liệu trong DB
  updatedAt: Date;
}

// Khởi tạo lược đồ recipeSchema dành cho bộ sưu tập Recipe
const recipeSchema = new Schema<IRecipe>(
  {
    // Cấu hình trường title: kiểu chuỗi, bắt buộc nhập và tự động loại bỏ khoảng trắng hai đầu (trim)
    title: { type: String, required: true, trim: true },
    // Cấu hình trường description: kiểu chuỗi và bắt buộc nhập
    description: { type: String, required: true },
    // Cấu hình trường ingredients: mảng chứa danh sách nguyên liệu dạng chuỗi
    ingredients: [{ type: String }],
    // Cấu hình trường instructions: mảng chứa danh sách các bước chế biến dạng chuỗi
    instructions: [{ type: String }],
    // Cấu hình trường imageUrl: kiểu chuỗi hình ảnh, mặc định là null
    imageUrl: { type: String, default: null },
    // Cấu hình trường authorId: liên kết với bộ sưu tập User, bắt buộc nhập và đánh index để tăng tốc độ tìm kiếm
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Cấu hình trường difficulty: kiểu chuỗi, chỉ nhận giá trị enum và mặc định là "Medium"
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    // Cấu hình trường cookingTime: kiểu số, mặc định là 30 phút
    cookingTime: { type: Number, default: 30 },
    // Cấu hình trường servings: kiểu số, mặc định là 2 người ăn
    servings: { type: Number, default: 2 },
    // Cấu hình trường tags: mảng các từ khóa gắn thẻ dạng chuỗi
    tags: [{ type: String }],
    // Cấu hình trường likes: mảng chứa các ObjectId tham chiếu đến bảng User
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true },
        userAvatar: { type: String, default: null },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Cấu hình trường viewCount: kiểu số lưu lượt xem, mặc định bằng 0
    viewCount: { type: Number, default: 0 },
  },
  // Kích hoạt tính năng timestamps tự động ghi nhận thời điểm tạo và cập nhật công thức
  { timestamps: true },
);

// Đánh chỉ mục index phức hợp theo authorId tăng dần và createdAt giảm dần để tối ưu hóa việc tải công thức mới nhất của một tác giả
recipeSchema.index({ authorId: 1, createdAt: -1 });
// Đánh chỉ mục tìm kiếm văn bản (Text Index) trên trường title và description để phục vụ tìm kiếm công thức bằng từ khóa nhanh chóng
recipeSchema.index({ title: "text", description: "text" });

// Tạo và xuất ra mô hình Recipe
export const Recipe = model<IRecipe>("Recipe", recipeSchema);

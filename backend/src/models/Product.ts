// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ sản phẩm hải sản
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IProduct mở rộng từ Document của Mongoose cho tài liệu sản phẩm (Product Document)
export interface IProduct extends Document {
  // Mã ID của người bán sở hữu sản phẩm này (kiểu ObjectId liên kết bảng User)
  sellerId: Types.ObjectId;
  // Vựa cá / phiên cập bến chứa sản phẩm (tùy chọn để tương thích dữ liệu cũ)
  batchId?: Types.ObjectId;
  // Loại sản phẩm: hải sản tươi sống (Fresh) hoặc đồ khô (Dried)
  type: "Fresh" | "Dried";
  // Danh mục phân loại hải sản cụ thể
  category: "Fish" | "Shrimp" | "Squid" | "Crab" | "Shellfish" | "Others";
  // Tên hiển thị của sản phẩm
  name: string;
  // Mô tả chi tiết về sản phẩm (có thể là null)
  description: string | null;
  // Giá bán của sản phẩm
  price: number;
  priceHistory: Array<{ price: number; changedAt: Date }>;
  // Hình thức bán hàng: Bán lẻ (Retail) hoặc Bán sỉ (Wholesale)
  salesType: "Retail" | "Wholesale";
  // Tổng khối lượng ban đầu của sản phẩm (kg)
  totalWeight: number;
  // Khối lượng sản phẩm còn lại sau khi bán (kg)
  remainingWeight: number;
  // Trạng thái hoạt động của sản phẩm: Đang bán (Active), Hết hạn (Expired), hoặc Đã xóa (Deleted)
  status: "Active" | "Expired" | "Deleted";
  // Dữ liệu GeoJSON phục vụ định vị vị trí lưu kho/bán sản phẩm
  location?: {
    // Kiểu dữ liệu không gian hình học bắt buộc là "Point"
    type: "Point";
    // Mảng lưu tọa độ theo chuẩn bắt buộc của GeoJSON: [Kinh độ, Vĩ độ]
    coordinates: [number, number];
  };
  // Dữ liệu GeoJSON phục vụ định vị vị trí đánh bắt sản phẩm tươi sống
  catchLocation?: {
    // Kiểu dữ liệu không gian hình học bắt buộc là "Point"
    type: "Point";
    // Mảng lưu tọa độ theo chuẩn bắt buộc của GeoJSON: [Kinh độ, Vĩ độ]
    coordinates: [number, number];
  };
  // Thời điểm đánh bắt sản phẩm (dành cho hải sản tươi sống)
  catchTime?: Date;
  // Nguồn gốc xuất xứ của sản phẩm
  origin?: string;
  // Hạn sử dụng của mẻ hàng sản phẩm
  expiryDate?: Date;
  // Mảng chứa các đường dẫn hình ảnh thực tế của sản phẩm
  images: string[];
  // Số lượt xem chi tiết sản phẩm
  viewCount: number;
  // Thời điểm đẩy bài đăng lên top gần nhất
  bumpedAt: Date;
  // Mốc thời gian tự động tạo tài liệu trong DB
  createdAt: Date;
  // Mốc thời gian tự động cập nhật tài liệu trong DB
  updatedAt: Date;
}

// Khởi tạo lược đồ productSchema dành cho bộ sưu tập Product
const productSchema = new Schema<IProduct>(
  {
    // Cấu hình trường sellerId: liên kết với bộ sưu tập User, bắt buộc nhập và đánh index để tối ưu hóa truy vấn sản phẩm của một shop
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "LandingBatch",
      index: true,
    },
    // Cấu hình trường type: kiểu chuỗi, bắt buộc nhập và nhận giá trị trong mảng enum
    type: { type: String, enum: ["Fresh", "Dried"], required: true },
    // Cấu hình trường category: kiểu chuỗi, bắt buộc nhập và nhận giá trị trong mảng enum danh mục hải sản
    category: {
      type: String,
      enum: ["Fish", "Shrimp", "Squid", "Crab", "Shellfish", "Others"],
      required: true,
    },
    // Cấu hình trường name: kiểu chuỗi, bắt buộc nhập và tự động cắt khoảng trắng hai đầu (trim)
    name: { type: String, required: true, trim: true },
    // Cấu hình trường description: kiểu chuỗi và mặc định bằng null
    description: { type: String, default: null },
    // Cấu hình trường price: kiểu số và bắt buộc nhập
    price: { type: Number, required: true },
    priceHistory: [
      {
        price: { type: Number, required: true },
        changedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    // Cấu hình trường salesType: kiểu chuỗi, bắt buộc nhận giá trị enum và mặc định là "Retail"
    salesType: {
      type: String,
      enum: ["Retail", "Wholesale"],
      default: "Retail",
    },
    // Cấu hình trường totalWeight: kiểu số và bắt buộc nhập
    totalWeight: { type: Number, required: true },
    // Cấu hình trường remainingWeight: kiểu số và bắt buộc nhập
    remainingWeight: { type: Number, required: true },
    // Cấu hình trường status: kiểu chuỗi, nhận giá trị enum trạng thái và mặc định là "Active"
    status: {
      type: String,
      enum: ["Active", "Expired", "Deleted"],
      default: "Active",
    },

    // Cấu hình GeoJSON định vị của sản phẩm
    // LƯU Ý BẢO MẬT/LOGIC: Không đặt "default: 'Point'" ở trường type vì Mongoose sẽ tự tạo đối tượng rỗng
    // khi lưu sản phẩm không có tọa độ (đồ khô), dẫn đến lỗi chỉ mục 2dsphere của MongoDB do thiếu tọa độ.
    location: {
      // Kiểu String và chỉ chấp nhận giá trị là "Point"
      type: { type: String, enum: ["Point"] },
      // Mảng lưu trữ các số thực đại diện cho tọa độ: [Kinh độ, Vĩ độ]
      coordinates: { type: [Number] },
    },

    // Cấu hình GeoJSON tọa độ nơi đánh bắt hải sản tươi sống
    catchLocation: {
      // Kiểu String và chỉ chấp nhận giá trị là "Point"
      type: { type: String, enum: ["Point"] },
      // Mảng lưu trữ tọa độ: [Kinh độ, Vĩ độ]
      coordinates: { type: [Number] },
    },

    // Cấu hình trường catchTime: kiểu thời gian Date
    catchTime: { type: Date },
    // Cấu hình trường origin: kiểu chuỗi lưu xuất xứ mẻ cá
    origin: { type: String },
    // Cấu hình trường expiryDate: kiểu thời gian Date lưu hạn dùng
    expiryDate: { type: Date },
    // Cấu hình trường images: mảng chứa các URL ảnh dạng chuỗi
    images: [{ type: String }],

    // Cấu hình trường viewCount: kiểu số lưu lượt xem, mặc định bằng 0
    viewCount: { type: Number, default: 0 },
    // Cấu hình trường bumpedAt: kiểu thời gian lưu mốc đẩy bài, mặc định là thời điểm hiện tại
    bumpedAt: { type: Date, default: Date.now },
  },
  // Kích hoạt timestamps tự động cập nhật thời gian tạo và cập nhật sản phẩm
  { timestamps: true },
);

// Thiết lập chỉ mục không gian hình học 2dsphere cho trường location để hỗ trợ tính toán khoảng cách địa lý (ví dụ: tìm sản phẩm quanh bán kính 20km)
productSchema.index({ location: "2dsphere" });
// Thiết lập chỉ mục index phức hợp tối ưu hóa tìm kiếm sản phẩm đang bán, theo loại, và sắp xếp đẩy bài xếp trước
productSchema.index({ status: 1, type: 1, bumpedAt: -1, createdAt: -1 });
// Thiết lập chỉ mục index phức hợp tối ưu hóa tìm kiếm sản phẩm của một shop sắp xếp theo mốc đẩy bài
productSchema.index({ sellerId: 1, bumpedAt: -1, createdAt: -1 });
productSchema.index({ batchId: 1, status: 1, createdAt: -1 });

// Thiết lập chỉ mục tìm kiếm văn bản toàn diện (Full-Text Search) trên hai trường name và description để hỗ trợ tìm kiếm bằng từ khóa tiếng Việt
productSchema.index({ name: "text", description: "text" });

// Tạo và xuất ra mô hình Product
export const Product = model<IProduct>("Product", productSchema);

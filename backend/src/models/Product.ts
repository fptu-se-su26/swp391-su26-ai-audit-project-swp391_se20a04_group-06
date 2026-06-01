import { Schema, model, Document, Types } from "mongoose";

export interface IPriceHistory {
  oldPrice: number;
  newPrice: number;
  changedAt: Date;
}

export interface IProduct extends Document {
  sellerId: Types.ObjectId;
  type: "Fresh" | "Dried";
  category: "Fish" | "Shrimp" | "Squid" | "Crab" | "Shellfish" | "Others";
  name: string;
  description: string | null;
  price: number;
  salesType: "Retail" | "Wholesale";
  totalWeight: number;
  remainingWeight: number;
  status: "Active" | "Expired" | "Deleted";
  // 🌟 GeoJSON cho định vị bản đồ 20km
  location?: {
    type: "Point";
    coordinates: [number, number]; // [Kinh độ, Vĩ độ] - chuẩn GeoJSON bắt buộc
  };
  catchTime?: Date;
  origin?: string;
  expiryDate?: Date;
  images: string[];
  priceHistory: IPriceHistory[];
  viewCount: number;
  bumpedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["Fresh", "Dried"], required: true },
    category: {
      type: String,
      enum: ["Fish", "Shrimp", "Squid", "Crab", "Shellfish", "Others"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    price: { type: Number, required: true },
    salesType: {
      type: String,
      enum: ["Retail", "Wholesale"],
      default: "Retail",
    },
    totalWeight: { type: Number, required: true },
    remainingWeight: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Active", "Expired", "Deleted"],
      default: "Active",
    },

    // Tích hợp GeoJSON định vị gốc của MongoDB
    // 💡 CHÚ Ý QUAN TRỌNG CHO LẬP TRÌNH VIÊN:
    // Tuyệt đối không được thêm `default: "Point"` ở trường `type` bên dưới.
    // Nếu thêm giá trị mặc định này, khi người dùng đăng bán sản phẩm KHÔNG có tọa độ (ví dụ sản phẩm khô "Dried"),
    // Mongoose vẫn tự tạo đối tượng `location` chứa `{ type: "Point" }` nhưng thiếu mảng tọa độ `coordinates`.
    // Khi lưu vào DB, chỉ mục địa lý 2dsphere của MongoDB sẽ báo lỗi 500 (Can't extract geo keys / Point must be an array).
    // Bỏ `default` đi sẽ giúp Mongoose không tự tạo đối tượng rỗng này, giúp sản phẩm lưu thành công và chỉ mục vẫn hoạt động tốt!
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }, // Mảng lưu trữ: [Kinh độ (lng), Vĩ độ (lat)] theo chuẩn bắt buộc của GeoJSON
    },

    catchTime: { type: Date },
    origin: { type: String },
    expiryDate: { type: Date },
    images: [{ type: String }],

    // Nhúng trực tiếp mảng lịch sử giá trong tài liệu
    priceHistory: [
      {
        oldPrice: { type: Number, required: true },
        newPrice: { type: Number, required: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    viewCount: { type: Number, default: 0 },
    bumpedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// 🌟 Thiết lập chỉ mục địa lý gốc 2dsphere hỗ trợ tìm kiếm khoảng cách cực nhanh
productSchema.index({ location: "2dsphere" });
productSchema.index({ status: 1, type: 1, bumpedAt: -1, createdAt: -1 });


// Thiết lập chỉ mục tìm kiếm văn bản toàn diện (MATCH...AGAINST replacement)
productSchema.index({ name: "text", description: "text" });

export const Product = model<IProduct>("Product", productSchema);

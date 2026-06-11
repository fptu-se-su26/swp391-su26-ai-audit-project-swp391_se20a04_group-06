import { Schema, model, Document, Types } from "mongoose";

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  productId: Types.ObjectId;
  reason: string;
  status: "Pending" | "Resolved" | "Dismissed";
  adminNote: string | null;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Resolved", "Dismissed"],
      default: "Pending",
    },
    adminNote: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TỐI ƯU HÓA TRUY VẤN: Đánh chỉ mục liên hợp hỗ trợ việc truy vấn và kiểm tra trùng lặp báo cáo nhanh hơn
reportSchema.index({ reporterId: 1, productId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

export const Report = model<IReport>("Report", reportSchema);

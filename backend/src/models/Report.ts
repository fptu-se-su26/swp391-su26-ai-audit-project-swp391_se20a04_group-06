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

export const Report = model<IReport>("Report", reportSchema);

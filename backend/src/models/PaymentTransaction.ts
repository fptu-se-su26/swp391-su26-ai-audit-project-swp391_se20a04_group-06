import { Schema, model, Document, Types } from "mongoose";

export interface IPaymentTransaction extends Document {
  gatewayTransactionId: string; // ID duy nhất từ Sepay/Ngân hàng để chặn trùng lặp
  userId: Types.ObjectId;
  amount: number;
  content: string;
  createdAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    gatewayTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PaymentTransaction = model<IPaymentTransaction>(
  "PaymentTransaction",
  paymentTransactionSchema,
);

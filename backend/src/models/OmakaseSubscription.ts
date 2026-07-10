import { Document, model, Schema, Types } from "mongoose";

export interface IOmakaseSubscription extends Document {
  userId: Types.ObjectId;
  plan: "Weekly" | "Monthly";
  deliveryAddress: string;
  phone: string;
  status: "Active" | "Cancelled";
  nextDeliveryAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const omakaseSubscriptionSchema = new Schema<IOmakaseSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    plan: { type: String, enum: ["Weekly", "Monthly"], required: true },
    deliveryAddress: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Active", "Cancelled"],
      default: "Active",
      index: true,
    },
    nextDeliveryAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const OmakaseSubscription = model<IOmakaseSubscription>(
  "OmakaseSubscription",
  omakaseSubscriptionSchema,
);

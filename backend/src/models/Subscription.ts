import { Schema, model, Document, Types } from "mongoose";

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  packageType: "Small" | "Medium" | "Large";
  price: number;
  frequency: "Weekly" | "BiWeekly" | "Monthly";
  preferredDay: string;
  shippingAddress: string;
  phone: string;
  note: string | null;
  status: "Pending" | "Active" | "Paused" | "Cancelled";
  nextDeliveryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    packageType: {
      type: String,
      enum: ["Small", "Medium", "Large"],
      required: true,
    },
    price: { type: Number, required: true },
    frequency: {
      type: String,
      enum: ["Weekly", "BiWeekly", "Monthly"],
      default: "Monthly",
    },
    preferredDay: { type: String, default: "Monday" },
    shippingAddress: { type: String, required: true },
    phone: { type: String, required: true },
    note: { type: String, default: null },
    status: {
      type: String,
      enum: ["Pending", "Active", "Paused", "Cancelled"],
      default: "Pending",
    },
    nextDeliveryDate: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Subscription = model<ISubscription>("Subscription", subscriptionSchema);

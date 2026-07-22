import { Document, Schema, Types, model } from "mongoose";

export type LandingBatchStatus = "Active" | "Closed" | "Deleted";

export interface ILandingBatch extends Document {
  sellerId: Types.ObjectId;
  title: string;
  description: string | null;
  boatType: "LargeBoat" | "SmallBoat";
  boatName?: string;
  catchArea?: string;
  catchTime?: Date;
  landingTime?: Date;
  origin?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  images: string[];
  status: LandingBatchStatus;
  boatLogId?: Types.ObjectId;
  notificationSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const landingBatchSchema = new Schema<ILandingBatch>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: null, maxlength: 3000 },
    boatType: {
      type: String,
      enum: ["LargeBoat", "SmallBoat"],
      default: "LargeBoat",
      required: true,
    },
    boatName: { type: String, trim: true, maxlength: 120 },
    catchArea: { type: String, trim: true, maxlength: 200 },
    catchTime: { type: Date },
    landingTime: { type: Date },
    origin: { type: String, trim: true, maxlength: 200 },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["Active", "Closed", "Deleted"],
      default: "Active",
      index: true,
    },
    boatLogId: {
      type: Schema.Types.ObjectId,
      ref: "BoatLog",
      index: true,
    },
    notificationSentAt: { type: Date },
  },
  { timestamps: true },
);

landingBatchSchema.index({ location: "2dsphere" });
landingBatchSchema.index({ status: 1, landingTime: -1, createdAt: -1 });
landingBatchSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

export const LandingBatch = model<ILandingBatch>(
  "LandingBatch",
  landingBatchSchema,
);

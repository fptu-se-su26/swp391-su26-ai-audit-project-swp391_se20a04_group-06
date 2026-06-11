import { Schema, model, Document, Types } from "mongoose";

export interface IBoatLog extends Document {
  userId: Types.ObjectId;
  userName: string;
  userAvatar: string | null;
  content: string;
  images: string[];
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const boatLogSchema = new Schema<IBoatLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: null },
    content: { type: String, required: true },
    images: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

boatLogSchema.index({ userId: 1, createdAt: -1 });

export const BoatLog = model<IBoatLog>("BoatLog", boatLogSchema);

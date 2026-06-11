import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "User" | "Admin";
  isActive: boolean;
  isVerified: boolean;
  avatar: string | null;
  favorites: Types.ObjectId[];
  following: Types.ObjectId[];
  isPremium: boolean;
  badges?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["User", "Admin"], default: "User" },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String, default: null },
    favorites: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPremium: { type: Boolean, default: false },
    badges: [{ type: String }],
  },
  { timestamps: true },
);

userSchema.index({ following: 1 });
userSchema.index({ favorites: 1 });

export const User = model<IUser>("User", userSchema);

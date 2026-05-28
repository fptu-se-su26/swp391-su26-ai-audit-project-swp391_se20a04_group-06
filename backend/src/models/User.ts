import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  phone: string;
  passwordHash: string;
  role: "User" | "Admin";
  isActive: boolean;
  isVerified: boolean;
  avatar: string | null;
  favorites: Schema.Types.ObjectId[];
  following: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["User", "Admin"], default: "User" },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String, default: null },
    favorites: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);

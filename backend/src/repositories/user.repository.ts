import { User } from "../models/User";
import mongoose from "mongoose";

export const userRepository = {
  async findByEmail(email: string) {
    const u = await User.findOne({ email });
    if (!u) return null;
    return {
      userId: u._id.toString(),
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      isActive: u.isActive,
      isVerified: u.isVerified,
      avatar: u.avatar,
      isPremium: u.isPremium,
    };
  },

  async findById(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const u = await User.findById(userId);
    if (!u) return null;
    return {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      isVerified: u.isVerified,
      avatarUrl: u.avatar,
      isPremium: u.isPremium,
    };
  },

  async emailExistsForOther(
    email: string,
    excludeUserId: any,
  ): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(excludeUserId)) return false;
    const u = await User.findOne({ email, _id: { $ne: excludeUserId } });
    return !!u;
  },

  async create(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<string> {
    const u = new User({
      name,
      email,
      passwordHash,
    });
    await u.save();
    return u._id.toString();
  },

  async getNameById(userId: any): Promise<string | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const u = await User.findById(userId).select("name");
    return u ? u.name : null;
  },

  async updateProfile(
    userId: any,
    fields: { name?: string; email?: string; avatar?: string; isVerified?: boolean }, // 👈 Bổ sung isVerified vào kiểu dữ liệu nhận diện
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    const updates: any = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.email !== undefined) updates.email = fields.email;
    if (fields.avatar !== undefined) updates.avatar = fields.avatar;

    // 🌟 GIẢI PHÁP: Bổ sung gán giá trị isVerified
    if (fields.isVerified !== undefined) updates.isVerified = fields.isVerified;

    await User.findByIdAndUpdate(userId, { $set: updates });
  },

  async getPasswordHash(userId: any): Promise<string | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const u = await User.findById(userId).select("passwordHash");
    return u ? u.passwordHash : null;
  },

  async updatePassword(userId: any, newHash: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    await User.findByIdAndUpdate(userId, { $set: { passwordHash: newHash } });
  },
};

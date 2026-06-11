import { User } from "../models/User";
import mongoose from "mongoose";

export const userRepository = {
  async findByEmail(email: string) {
    const user = await User.findOne({ email });
    if (!user) return null;
    return {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      avatar: user.avatar,
      isPremium: user.isPremium,
    };
  },

  async findById(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const user = await User.findById(userId);
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      avatarUrl: user.avatar,
      isPremium: user.isPremium,
    };
  },

  async emailExistsForOther(
    email: string,
    excludeUserId: any,
  ): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(excludeUserId)) return false;
    const user = await User.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
  },

  async create(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<string> {
    const user = new User({
      name,
      email,
      passwordHash,
    });
    await user.save();
    return user._id.toString();
  },

  async getNameById(userId: any): Promise<string | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const user = await User.findById(userId).select("name");
    return user ? user.name : null;
  },

  async updateProfile(
    userId: any,
    fields: { name?: string; email?: string; avatar?: string; isVerified?: boolean },
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    const updates: any = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.email !== undefined) updates.email = fields.email;
    if (fields.avatar !== undefined) updates.avatar = fields.avatar;

    if (fields.isVerified !== undefined) updates.isVerified = fields.isVerified;

    await User.findByIdAndUpdate(userId, { $set: updates });
  },

  async getPasswordHash(userId: any): Promise<string | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const user = await User.findById(userId).select("passwordHash");
    return user ? user.passwordHash : null;
  },

  async updatePassword(userId: any, newHash: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    await User.findByIdAndUpdate(userId, { $set: { passwordHash: newHash } });
  },
};

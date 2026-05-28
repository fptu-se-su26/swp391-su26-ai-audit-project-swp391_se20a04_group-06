import { User } from "../models/User";
import mongoose from "mongoose";

export const userRepository = {
  async findByPhone(phone: string) {
    const u = await User.findOne({ phone });
    if (!u) return null;
    return {
      UserID: u._id.toString(),
      Name: u.name,
      Phone: u.phone,
      PasswordHash: u.passwordHash,
      Role: u.role,
      IsActive: u.isActive ? 1 : 0,
      IsVerified: u.isVerified ? 1 : 0,
      Avatar: u.avatar,
    };
  },

  async findById(userId: any) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const u = await User.findById(userId);
    if (!u) return null;
    return {
      id: u._id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive ? 1 : 0,
      isVerified: u.isVerified ? 1 : 0,
      avatarUrl: u.avatar,
    };
  },

  async phoneExistsForOther(
    phone: string,
    excludeUserId: any,
  ): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(excludeUserId)) return false;
    const u = await User.findOne({ phone, _id: { $ne: excludeUserId } });
    return !!u;
  },

  async create(
    name: string,
    phone: string,
    passwordHash: string,
  ): Promise<string> {
    const u = new User({
      name,
      phone,
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
    fields: { name?: string; phone?: string; avatar?: string },
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    const updates: any = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.phone !== undefined) updates.phone = fields.phone;
    if (fields.avatar !== undefined) updates.avatar = fields.avatar;

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

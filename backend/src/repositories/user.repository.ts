import { User, IUser } from "../models/User";
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
      badges: user.badges || [],
      createdAt: user.createdAt,
    };
  },

  async findRawById(userId: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return User.findById(userId);
  },

  async findById(userId: string) {
    const user = await this.findRawById(userId);
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
      badges: user.badges || [],
      createdAt: user.createdAt,
    };
  },

  async findFavoritesPopulated(userId: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return User.findById(userId).populate({
      path: "favorites",
      populate: { path: "sellerId", select: "name isVerified" },
    });
  },

  async exists(query: any): Promise<boolean> {
    return !!(await User.exists(query));
  },

  async countDocuments(filter: any): Promise<number> {
    return User.countDocuments(filter);
  },

  async find(
    filter: any,
    sort: any = {},
    skip = 0,
    limit = 100,
  ): Promise<IUser[]> {
    return User.find(filter).sort(sort).skip(skip).limit(limit);
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
    fields: {
      name?: string;
      email?: string;
      avatar?: string;
      isVerified?: boolean;
    },
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    const updates: any = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.email !== undefined) updates.email = fields.email;
    if (fields.avatar !== undefined) updates.avatar = fields.avatar;
    if (fields.isVerified !== undefined) updates.isVerified = fields.isVerified;

    await User.findByIdAndUpdate(userId, { $set: updates });
  },

  async updateActiveStatus(
    userId: string,
    isActive: boolean,
  ): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return User.findByIdAndUpdate(
      userId,
      { $set: { isActive } },
      { new: true },
    );
  },

  async updateVerificationStatus(
    userId: string,
    isVerified: boolean,
  ): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return User.findByIdAndUpdate(
      userId,
      { $set: { isVerified } },
      { new: true },
    );
  },

  async updateBadges(userId: string, badges: string[]): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    await User.findByIdAndUpdate(userId, { $set: { badges } });
  },

  async addFavorite(userId: string, productId: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { favorites: new mongoose.Types.ObjectId(productId) as any },
      },
      { new: true },
    );
  },

  async removeFavorite(
    userId: string,
    productId: string,
  ): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: new mongoose.Types.ObjectId(productId) as any } },
      { new: true },
    );
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

  async isFollowing(userId: string, sellerId: string): Promise<boolean> {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(sellerId)
    ) {
      return false;
    }
    const user = await User.findOne({
      _id: userId,
      following: new mongoose.Types.ObjectId(sellerId),
    });
    return !!user;
  },

  async followSeller(userId: string, sellerId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { following: new mongoose.Types.ObjectId(sellerId) as any },
    });
  },

  async unfollowSeller(userId: string, sellerId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { following: new mongoose.Types.ObjectId(sellerId) as any },
    });
  },

  async deleteById(userId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return User.findByIdAndDelete(userId);
  },

  async updateMany(filter: any, update: any): Promise<any> {
    return User.updateMany(filter, update);
  },

  async aggregate(pipeline: any[]): Promise<any[]> {
    return User.aggregate(pipeline);
  },
};

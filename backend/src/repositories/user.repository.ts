import { MongooseUserRepository } from "../modules/iam/infrastructure/persistence/mongoose/MongooseUserRepository";
import { User as DomainUser } from "../modules/iam/domain/entities/User";
import { User as MongooseUser } from "../models/User";
import mongoose from "mongoose";

const dddUserRepository = new MongooseUserRepository();

export const userRepository = {
  async findByEmail(email: string) {
    const user = await dddUserRepository.findByEmail(email);
    if (!user) return null;
    const props = user.toProps();
    return {
      userId: props.id,
      name: props.name,
      email: props.email,
      passwordHash: props.passwordHash,
      role: props.role,
      isActive: props.isActive,
      isVerified: props.isVerified,
      avatar: props.avatar,
      isPremium: props.isPremium,
      badges: props.badges || [],
    };
  },

  async findRawById(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return MongooseUser.findById(userId);
  },

  async findById(userId: string) {
    const user = await dddUserRepository.findById(userId);
    if (!user) return null;
    const props = user.toProps();
    return {
      id: props.id,
      name: props.name,
      email: props.email,
      role: props.role,
      isActive: props.isActive,
      isVerified: props.isVerified,
      avatarUrl: props.avatar,
      isPremium: props.isPremium,
      badges: props.badges || [],
    };
  },

  async findFavoritesPopulated(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return MongooseUser.findById(userId).populate({
      path: "favorites",
      populate: { path: "sellerId", select: "name isVerified" },
    });
  },

  async exists(query: any): Promise<boolean> {
    return !!(await MongooseUser.exists(query));
  },

  async countDocuments(filter: any): Promise<number> {
    return MongooseUser.countDocuments(filter);
  },

  async find(filter: any, sort: any = {}, skip = 0, limit = 100) {
    return MongooseUser.find(filter).sort(sort).skip(skip).limit(limit);
  },

  async emailExistsForOther(email: string, excludeUserId: any): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(excludeUserId)) return false;
    const user = await MongooseUser.findOne({ email: email.toLowerCase().trim(), _id: { $ne: excludeUserId } });
    return !!user;
  },

  async create(name: string, email: string, passwordHash: string): Promise<string> {
    const user = new DomainUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "User",
      isActive: true,
      isVerified: false,
      isPremium: false,
      avatar: null,
      badges: [],
      favorites: [],
      following: [],
    });
    await dddUserRepository.save(user);
    return user.id;
  },

  async getNameById(userId: any): Promise<string | null> {
    const user = await dddUserRepository.findById(userId.toString());
    return user ? user.name : null;
  },

  async updateProfile(
    userId: any,
    fields: {
      name?: string;
      email?: string;
      avatar?: string;
      isVerified?: boolean;
    }
  ): Promise<void> {
    const user = await dddUserRepository.findById(userId.toString());
    if (!user) return;
    
    user.updateProfile(
      fields.name ?? user.name,
      fields.email ?? user.email,
      fields.avatar ?? (user.avatar || undefined)
    );
    if (fields.isVerified !== undefined) {
      user.updateVerification(fields.isVerified);
    }
    await dddUserRepository.save(user);
  },

  async updateActiveStatus(userId: string, isActive: boolean) {
    const user = await dddUserRepository.findById(userId);
    if (!user) return null;
    user.updateActiveStatus(isActive);
    await dddUserRepository.save(user);
    return MongooseUser.findById(userId);
  },

  async updateVerificationStatus(userId: string, isVerified: boolean) {
    const user = await dddUserRepository.findById(userId);
    if (!user) return null;
    user.updateVerification(isVerified);
    await dddUserRepository.save(user);
    return MongooseUser.findById(userId);
  },

  async updateBadges(userId: string, badges: string[]): Promise<void> {
    const user = await dddUserRepository.findById(userId);
    if (!user) return;
    user.updateBadges(badges);
    await dddUserRepository.save(user);
  },

  async addFavorite(userId: string, productId: string) {
    const user = await dddUserRepository.findById(userId);
    if (!user) return null;
    user.addFavorite(productId);
    await dddUserRepository.save(user);
    return MongooseUser.findById(userId);
  },

  async removeFavorite(userId: string, productId: string) {
    const user = await dddUserRepository.findById(userId);
    if (!user) return null;
    user.removeFavorite(productId);
    await dddUserRepository.save(user);
    return MongooseUser.findById(userId);
  },

  async getPasswordHash(userId: any): Promise<string | null> {
    const user = await dddUserRepository.findById(userId.toString());
    return user ? user.passwordHash : null;
  },

  async updatePassword(userId: any, newHash: string): Promise<void> {
    const user = await dddUserRepository.findById(userId.toString());
    if (!user) return;
    user.updatePassword(newHash);
    await dddUserRepository.save(user);
  },

  async isFollowing(userId: string, sellerId: string): Promise<boolean> {
    const user = await dddUserRepository.findById(userId);
    if (!user) return false;
    return user.following.includes(sellerId);
  },

  async followSeller(userId: string, sellerId: string): Promise<void> {
    const user = await dddUserRepository.findById(userId);
    if (!user) return;
    user.follow(sellerId);
    await dddUserRepository.save(user);
  },

  async unfollowSeller(userId: string, sellerId: string): Promise<void> {
    const user = await dddUserRepository.findById(userId);
    if (!user) return;
    user.unfollow(sellerId);
    await dddUserRepository.save(user);
  },

  async deleteById(userId: string): Promise<any> {
    const user = await dddUserRepository.findById(userId);
    if (!user) return null;
    await dddUserRepository.delete(user);
    return true;
  },

  async updateMany(filter: any, update: any): Promise<any> {
    return MongooseUser.updateMany(filter, update);
  },

  async aggregate(pipeline: any[]): Promise<any[]> {
    return MongooseUser.aggregate(pipeline);
  },
};

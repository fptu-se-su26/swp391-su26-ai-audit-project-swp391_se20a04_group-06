import { BoatLog } from "../models/BoatLog";
import mongoose from "mongoose";

export const boatLogRepository = {
  async findAll(filter: any, skip: number, limit: number) {
    const [boatLogs, total] = await Promise.all([
      BoatLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BoatLog.countDocuments(filter),
    ]);
    return { boatLogs, total };
  },

  async findById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return BoatLog.findById(id);
  },

  async create(data: {
    userId: string;
    userName: string;
    userAvatar: string | null;
    content: string;
    images: string[];
  }) {
    const log = new BoatLog(data);
    await log.save();
    return log;
  },

  async addLike(logId: string, userId: string) {
    return BoatLog.findByIdAndUpdate(
      logId,
      { $addToSet: { likes: userId } },
      { new: true },
    );
  },

  async removeLike(logId: string, userId: string) {
    return BoatLog.findByIdAndUpdate(
      logId,
      { $pull: { likes: userId as any } },
      { new: true },
    );
  },

  async updateMany(filter: any, update: any) {
    return BoatLog.updateMany(filter, update);
  },

  async deleteMany(filter: any) {
    return BoatLog.deleteMany(filter);
  },

  async delete(id: string) {
    return BoatLog.findByIdAndDelete(id);
  },
  async countDocuments(filter: any): Promise<number> {
    return BoatLog.countDocuments(filter);
  },
};

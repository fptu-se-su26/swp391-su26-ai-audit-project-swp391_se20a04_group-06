import { BoatLog as MongooseBoatLog } from "../models/BoatLog";
import { MongooseBoatLogRepository } from "../modules/boat-log/infrastructure/persistence/mongoose/MongooseBoatLogRepository";
import { BoatLog as DomainBoatLog } from "../modules/boat-log/domain/entities/BoatLog";
import mongoose from "mongoose";

const dddBoatLogRepository = new MongooseBoatLogRepository();

/**
 * Repository cho BoatLog hoạt động như lớp Chống Tham Nhũng (Anti-Corruption Layer).
 * Tối ưu hóa các API đọc trực tiếp và đảm bảo toàn vẹn qua Domain Entity cho các API ghi.
 */
export const boatLogRepository = {
  // ── READ OPERATIONS ────────────────────────────────────────────────────────
  async findAll(filter: any, skip: number, limit: number) {
    const [boatLogs, total] = await Promise.all([
      MongooseBoatLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      MongooseBoatLog.countDocuments(filter),
    ]);
    return { boatLogs, total };
  },

  async findById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return MongooseBoatLog.findById(id);
  },

  async countDocuments(filter: any): Promise<number> {
    return MongooseBoatLog.countDocuments(filter);
  },

  // ── WRITE OPERATIONS ───────────────────────────────────────────────────────
  async create(data: {
    userId: string;
    userName: string;
    userAvatar: string | null;
    content: string;
    images: string[];
  }) {
    const domainLog = new DomainBoatLog({
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      content: data.content,
      images: data.images,
      likes: [],
    });

    await dddBoatLogRepository.save(domainLog);
    return (await MongooseBoatLog.findById(domainLog.id))!;
  },

  async addLike(logId: string, userId: string) {
    const domainLog = await dddBoatLogRepository.findById(logId);
    if (!domainLog) return null;

    if (!domainLog.likes.includes(userId)) {
      domainLog.toggleLike(userId);
      await dddBoatLogRepository.save(domainLog);
    }
    return MongooseBoatLog.findById(logId);
  },

  async removeLike(logId: string, userId: string) {
    const domainLog = await dddBoatLogRepository.findById(logId);
    if (!domainLog) return null;

    if (domainLog.likes.includes(userId)) {
      domainLog.toggleLike(userId);
      await dddBoatLogRepository.save(domainLog);
    }
    return MongooseBoatLog.findById(logId);
  },

  async updateMany(filter: any, update: any) {
    return MongooseBoatLog.updateMany(filter, update);
  },

  async deleteMany(filter: any) {
    return MongooseBoatLog.deleteMany(filter);
  },

  async delete(id: string) {
    const domainLog = await dddBoatLogRepository.findById(id);
    if (domainLog) {
      await dddBoatLogRepository.delete(domainLog);
    }
    return true;
  },
};

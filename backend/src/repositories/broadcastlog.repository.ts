import { BroadcastLog, IBroadcastLog } from "../models/BroadcastLog";
import mongoose from "mongoose";

export const broadcastLogRepository = {
  async create(data: {
    adminId: string;
    content: string;
    targetRole: "all" | "Seller" | "Buyer";
    sentCount: number;
  }): Promise<IBroadcastLog> {
    const log = new BroadcastLog({
      adminId: new mongoose.Types.ObjectId(data.adminId),
      content: data.content,
      targetRole: data.targetRole,
      sentCount: data.sentCount,
    });
    return log.save();
  },

  async findRecent(limit = 20): Promise<IBroadcastLog[]> {
    return BroadcastLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as unknown as IBroadcastLog[];
  },
};

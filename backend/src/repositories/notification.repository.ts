import { Notification, INotification } from "../models/Notification";
import mongoose from "mongoose";

export const notificationRepository = {
  async findByUserId(userId: string, limit = 50): Promise<INotification[]> {
    return Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  async findOne(
    notifId: string,
    userId: string,
  ): Promise<INotification | null> {
    return Notification.findOne({
      _id: new mongoose.Types.ObjectId(notifId),
      userId: new mongoose.Types.ObjectId(userId),
    });
  },

  async markAllAsRead(userId: string): Promise<any> {
    return Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { isRead: true } },
    );
  },

  async insertMany(
    docs: Array<Partial<INotification>>,
  ): Promise<INotification[]> {
    return Notification.insertMany(docs) as unknown as INotification[];
  },

  async create(data: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(data);
    return notification.save();
  },

  async deleteByProductId(productId: string): Promise<any> {
    return Notification.deleteMany({
      productId: new mongoose.Types.ObjectId(productId) as any,
    });
  },

  async deleteByUserId(userId: string): Promise<any> {
    return Notification.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });
  },
};

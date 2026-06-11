import mongoose from "mongoose";
import { Message, IMessage } from "../models/Message";

export const messageRepository = {
  // ✅ FIX 2: Thêm replyTo vào kiểu dữ liệu của create()
  async create(data: {
    productId: string;
    senderId: string;
    receiverId: string;
    content: string | null;
    imageUrl?: string | null;
    location?: { latitude: number; longitude: number; address?: string } | null;
    replyTo?: { senderId: string; content: string } | null;
  }) {
    const msg = new Message(data);
    await msg.save();
    return msg;
  },

  async find(
    filter: any,
    populateOpts?: any,
    sortOpts?: any,
  ): Promise<IMessage[]> {
    let query = Message.find(filter);
    if (populateOpts) query = query.populate(populateOpts);
    if (sortOpts) query = query.sort(sortOpts);
    return query;
  },

  async findConversation(productId: string, userId1: string, userId2: string) {
    return Message.find({
      productId,
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    } as any)
      .populate("senderId", "name")
      .sort({ createdAt: 1 });
  },

  async markAsRead(productId: string, fromUserId: string, toUserId: string) {
    return Message.updateMany(
      {
        productId,
        senderId: fromUserId,
        receiverId: toUserId,
        isRead: false,
      } as any,
      { $set: { isRead: true } },
    );
  },

  async updateMany(filter: any, update: any): Promise<any> {
    return Message.updateMany(filter, update);
  },

  async deleteMany(filter: any): Promise<any> {
    return Message.deleteMany(filter);
  },

  async countDocuments(filter: any): Promise<number> {
    return Message.countDocuments(filter);
  },

  async countUnread(receiverId: string): Promise<number> {
    return Message.countDocuments({ receiverId, isRead: false } as any);
  },

  async getConversationAggregation(
    userId: string,
    skip: number = 0,
    limit: number = 50,
  ) {
    return Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            productId: "$productId",
            otherUserId: {
              $cond: [
                { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
                "$receiverId",
                "$senderId",
              ],
            },
          },
          lastMessage: { $first: "$content" },
          lastMessageImageUrl: { $first: "$imageUrl" },
          lastLocation: { $first: "$location" },
          lastSentAt: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isRead", false] },
                    {
                      $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.otherUserId",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$otherUser", preserveNullAndEmptyArrays: true } },
      { $sort: { lastSentAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
  },
};

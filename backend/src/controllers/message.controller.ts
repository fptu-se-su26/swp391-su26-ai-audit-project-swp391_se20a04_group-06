import { Request, Response } from "express";
import { Message } from "../models/Message";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { sendServerError, parseId } from "../helpers/response.helper";
import { uploadToCloudinary } from "../middlewares/upload";
import mongoose from "mongoose";

export async function getMessages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseId(req.params.productId);
  if (!productId)
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  try {
    const filter: any = { productId };
    if (role !== "Admin") {
      filter.$or = [{ senderId: userId }, { receiverId: userId }];
    }

    const messages = await Message.find(filter)
      .populate("senderId", "name")
      .sort({ createdAt: 1 });

    // 🌟 Ép kiểu 'as any' toàn bộ đối tượng điều kiện truy vấn để sửa lỗi overload matches
    await Message.updateMany(
      { productId, receiverId: userId, isRead: false } as any,
      { $set: { isRead: true } },
    );

    const formattedRows = messages.map((m: any) => ({
      id: m._id.toString(),
      senderId: m.senderId?._id.toString(),
      senderName: m.senderId?.name || "Một người dùng",
      receiverId: m.receiverId.toString(),
      content: m.content,
      imageUrl: m.imageUrl,
      isRead: m.isRead,
      sentAt: m.createdAt,
    }));

    return res.json(formattedRows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function sendMessage(req: Request, res: Response) {
  const { userId } = req.user;
  const { productId, receiverId, content, imageUrl } = req.body;

  if (!productId || !receiverId)
    return res.status(400).json({ message: "Thiếu thông tin nhận tin" });

  if (!content?.trim() && !imageUrl)
    return res.status(400).json({ message: "Nội dung tin nhắn trống" });

  if (receiverId === userId)
    return res
      .status(400)
      .json({ message: "Không thể tự gửi tin nhắn cho chính mình" });

  try {
    const newMsg = new Message({
      productId,
      senderId: userId,
      receiverId,
      content: content ? content.trim() : null,
      imageUrl: imageUrl || null,
    });

    await newMsg.save();

    return res
      .status(201)
      .json({ id: newMsg._id.toString(), message: "Gửi thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

// 🌟 API Upload ảnh trong cuộc hội thoại Chat
export async function uploadChatImage(req: Request, res: Response) {
  if (!req.file)
    return res.status(400).json({ message: "Chưa chọn file ảnh gửi kèm" });

  try {
    const { url } = await uploadToCloudinary(req.file.buffer, "chat_images");
    return res.json({ imageUrl: url });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function unreadCount(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    // 🌟 Ép kiểu 'as any' cho bộ lọc tìm kiếm để khắc phục lỗi gạch đỏ receiverId
    const count = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    } as any);
    return res.json({ count });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getConversations(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const conversations = await Message.aggregate([
      // 1. Lọc các tin nhắn liên quan đến userId
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      // 2. Sắp xếp giảm dần theo thời gian
      { $sort: { createdAt: -1 } },
      // 3. Nhóm theo cặp (productId, otherUserId)
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
          lastSentAt: { $first: "$createdAt" },
          unreadMsgs: {
            $push: {
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
                "$$REMOVE",
              ],
            },
          },
        },
      },
      // 4. Lookup Product details
      {
        $lookup: {
          from: "products",
          localField: "_id.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      // 5. Lookup User details (other user)
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
      // Sắp xếp các cuộc hội thoại theo tin nhắn cuối cùng mới nhất
      { $sort: { lastSentAt: -1 } },
    ]);

    const formattedRows = conversations.map((conv: any) => ({
      productId: conv._id.productId?.toString() || "",
      otherUserId: conv._id.otherUserId?.toString() || "",
      productName: conv.product?.name || "Sản phẩm đã bị xóa",
      otherUserName: conv.otherUser?.name || "Một người dùng",
      otherUserIsVerified: conv.otherUser?.isVerified ? 1 : 0,
      lastMessage: conv.lastMessage,
      lastMessageImageUrl: conv.lastMessageImageUrl,
      lastSentAt: conv.lastSentAt,
      unread: conv.unreadMsgs ? conv.unreadMsgs.length : 0,
    }));

    return res.json(formattedRows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

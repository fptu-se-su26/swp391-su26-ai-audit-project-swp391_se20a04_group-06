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

    const messageIds = messages.map((m) => m._id);
    if (messageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: messageIds }, receiverId: userId, isRead: false } as any,
        { $set: { isRead: true } },
      );
    }

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
    // [M-05 PERFORMANCE NOTE]
    // Pipeline này sử dụng mô hình $sort -> $group -> $sort để trích xuất tin nhắn cuối cùng của mỗi cuộc hội thoại.
    // Mặc dù chính xác về mặt kết quả, việc thực hiện $sort trên toàn bộ tin nhắn liên quan trước khi group có thể 
    // làm suy giảm hiệu năng khi số lượng bản ghi tin nhắn lớn (hàng triệu bản ghi).
    // KHUYẾN NGHỊ: Xem xét phi chuẩn hóa (denormalize) các trường `lastMessage`, `unreadCount` vào một collection 
    // `Conversations` riêng biệt và cập nhật real-time để loại bỏ bước aggregation nặng nề này.
    const conversations = await Message.aggregate([
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
          lastSentAt: { $first: "$createdAt" },
          // TỐI ƯU HÓA: Sử dụng toán tử $sum hiệu suất cao thay vì $push
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
      unread: conv.unreadCount || 0,
    }));

    return res.json(formattedRows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

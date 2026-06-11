import { Request, Response } from "express";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { sendServerError, parseId } from "../helpers/response.helper";
import { uploadToCloudinary } from "../middlewares/upload";
import mongoose from "mongoose";

// 🌟 Get messages with location-awareness (isolated by buyerId)
export async function getMessages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseId(req.params.productId);
  if (!productId)
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  const buyerIdStr = req.query.buyerId as string;

  try {
    const filter: any = { productId };
    if (role !== "Admin") {
      const prod = await Product.findById(productId);
      if (!prod) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }
      const isSeller = prod.sellerId.toString() === userId;
      const buyerId = isSeller ? buyerIdStr : userId;
      if (!buyerId) {
        return res.status(400).json({ message: "Thiếu thông tin người mua (buyerId)" });
      }
      filter.$or = [
        { senderId: buyerId, receiverId: prod.sellerId.toString() },
        { senderId: prod.sellerId.toString(), receiverId: buyerId }
      ];

      // Update unread status first to ensure synchronicity for this specific conversation
      const partnerId = isSeller ? buyerId : prod.sellerId.toString();
      await Message.updateMany(
        { productId, senderId: partnerId, receiverId: userId, isRead: false } as any,
        { $set: { isRead: true } },
      );
    } else if (buyerIdStr) {
      const prod = await Product.findById(productId);
      if (prod) {
        filter.$or = [
          { senderId: buyerIdStr, receiverId: prod.sellerId.toString() },
          { senderId: prod.sellerId.toString(), receiverId: buyerIdStr }
        ];
      }
    }

    const messages = await Message.find(filter)
      .populate("senderId", "name")
      .sort({ createdAt: 1 });

    const formattedRows = messages.map((m: any) => ({
      id: m._id.toString(),
      senderId: m.senderId?._id.toString(),
      senderName: m.senderId?.name || "Một người dùng",
      receiverId: m.receiverId.toString(),
      content: m.content,
      imageUrl: m.imageUrl,
      location: m.location, // 🌟 Return location details to client
      isRead: m.isRead,
      sentAt: m.createdAt,
    }));

    return res.json(formattedRows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

// 🌟 Send message with location support
export async function sendMessage(req: Request, res: Response) {
  const { userId } = req.user;
  const { productId, receiverId, content, imageUrl, location } = req.body; // 🌟 Accept location

  if (!productId || !receiverId)
    return res.status(400).json({ message: "Thiếu thông tin nhận tin" });

  if (!content?.trim() && !imageUrl && !location)
    return res.status(400).json({ message: "Nội dung tin nhắn trống" });

  if (receiverId === userId)
    return res
      .status(400)
      .json({ message: "Không thể tự gửi tin nhắn cho chính mình" });

  try {
    const cleanContent = content
      ? content
          .trim()
          .replace(/<[^>]*>/g, "")
          .slice(0, 1000)
      : null;

    const newMsg = new Message({
      productId,
      senderId: userId,
      receiverId,
      content: cleanContent,
      imageUrl: imageUrl || null,
      location: location || null, // 🌟 Save location
    });

    await newMsg.save();

    return res.status(201).json({
      id: newMsg._id.toString(),
      location: newMsg.location, // Return location to display on client immediately
      message: "Gửi thành công",
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

// 🌟 Get conversations list with unread counts and last location
export async function getConversations(req: Request, res: Response) {
  const { userId } = req.user;
  try {
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
          lastLocation: { $first: "$location" }, // 🌟 Get last location
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
    ]);

    const formattedRows = conversations.map((conv: any) => {
      let displayMessage = conv.lastMessage;
      if (!displayMessage) {
        if (conv.lastMessageImageUrl) {
          displayMessage = "📷 [Hình ảnh]";
        } else if (conv.lastLocation) {
          displayMessage = "📍 [Vị trí]";
        } else {
          displayMessage = "";
        }
      }

      return {
        productId: conv._id.productId?.toString() || "",
        otherUserId: conv._id.otherUserId?.toString() || "",
        productSellerId: conv.product?.sellerId?.toString() || "",
        productName: conv.product?.name || "Sản phẩm đã bị xóa",
        otherUserName: conv.otherUser?.name || "Một người dùng",
        otherUserIsVerified: conv.otherUser?.isVerified ? 1 : 0,
        lastMessage: displayMessage,
        lastMessageImageUrl: conv.lastMessageImageUrl,
        lastSentAt: conv.lastSentAt,
        unread: conv.unreadCount || 0,
      };
    });

    return res.json(formattedRows);
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

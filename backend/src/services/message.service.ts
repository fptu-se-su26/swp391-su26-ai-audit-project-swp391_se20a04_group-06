import { messageRepository } from "../repositories/message.repository";
import { productRepository } from "../repositories/product.repository";
import { HttpError } from "../errors/HttpError";
import { getIO } from "../socket";
import { logger } from "../utils/logger";

export const messageService = {
  async getMessages(
    productId: string,
    userId: string,
    role: string,
    buyerIdStr?: string,
  ) {
    const filter: any = { productId };

    if (role !== "Admin") {
      const prod = await productRepository.findById(productId);
      if (!prod) throw new HttpError(404, "Sản phẩm không tồn tại");

      const isSeller = prod.sellerId.toString() === userId;
      const buyerId = isSeller ? buyerIdStr : userId;
      if (!buyerId) {
        throw new HttpError(400, "Thiếu thông tin người mua (buyerId)");
      }

      filter.$or = [
        { senderId: buyerId, receiverId: prod.sellerId.toString() },
        { senderId: prod.sellerId.toString(), receiverId: buyerId },
      ];

      const partnerId = isSeller ? buyerId : prod.sellerId.toString();
      await messageRepository.markAsRead(productId, partnerId, userId);
    } else if (buyerIdStr) {
      const prod = await productRepository.findById(productId);
      if (prod) {
        filter.$or = [
          { senderId: buyerIdStr, receiverId: prod.sellerId.toString() },
          { senderId: prod.sellerId.toString(), receiverId: buyerIdStr },
        ];
      }
    }

    const messages = await messageRepository.find(
      filter,
      { path: "senderId", select: "name" },
      { createdAt: 1 },
    );

    // ✅ FIX 1: Trả về đầy đủ các trường mới
    return messages.map((m: any) => ({
      id: m._id.toString(),
      senderId: m.senderId?._id.toString(),
      senderName: m.senderId?.name || "Một người dùng",
      receiverId: m.receiverId.toString(),
      content: m.content,
      imageUrl: m.imageUrl,
      location: m.location,
      replyTo: m.replyTo || null, // ✅ thêm
      isRead: m.isRead,
      isRecalled: m.isRecalled, // ✅ thêm
      reaction: m.reaction, // ✅ thêm
      sentAt: m.createdAt,
    }));
  },

  async sendMessage(userId: string, data: any) {
    // ✅ FIX 2: Destructure replyTo từ data
    const { productId, receiverId, content, imageUrl, location, replyTo } =
      data;

    if (receiverId === userId) {
      throw new HttpError(400, "Không thể tự gửi tin nhắn cho chính mình");
    }

    if (!content?.trim() && !imageUrl && !location) {
      throw new HttpError(400, "Tin nhắn không được rỗng");
    }

    const cleanContent = content
      ? content
          .trim()
          .replace(/<[^>]*>/g, "")
          .slice(0, 1000)
      : null;

    const newMsg = await messageRepository.create({
      productId,
      senderId: userId,
      receiverId,
      content: cleanContent,
      imageUrl: imageUrl || null,
      location: location || null,
      replyTo: replyTo || null, // ✅ FIX 2: Truyền replyTo vào repository
    });

    try {
      const prod = await productRepository.findById(productId);
      if (prod) {
        const isSeller = prod.sellerId.toString() === userId;
        const buyerId = isSeller ? receiverId : userId;
        const roomName = `product_${productId}_${buyerId}`;

        const io = getIO();
        const messageResponse = {
          id: newMsg._id.toString(),
          productId,
          senderId: userId,
          receiverId,
          content: newMsg.content,
          imageUrl: newMsg.imageUrl,
          location: newMsg.location,
          replyTo: newMsg.replyTo || null, // ✅ FIX 2: Emit replyTo qua socket
          sentAt: newMsg.createdAt,
          isRead: false,
          isRecalled: false,
          reaction: null,
        };

        io.to(roomName).emit("new_message", messageResponse);

        let previewText = "Bạn có tin nhắn mới";
        if (imageUrl) previewText = "📷 [Hình ảnh]";
        else if (location) previewText = "📍 [Vị trí]";
        else if (content) previewText = content.trim().slice(0, 40);

        io.to(`user_${receiverId}`).emit("notification", {
          type: "new_message",
          productId,
          senderId: userId,
          preview: previewText,
        });
      }
    } catch (err) {
      logger.error("Error emitting socket message from REST API:", err);
    }

    return newMsg;
  },

  async getConversations(userId: string, skip: number = 0, limit: number = 50) {
    const conversations = await messageRepository.getConversationAggregation(
      userId,
      skip,
      limit,
    );

    return conversations.map((conv: any) => {
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
  },
};

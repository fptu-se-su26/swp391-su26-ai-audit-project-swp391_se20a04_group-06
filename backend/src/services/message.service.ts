// Import đối tượng messageRepository để thực hiện các thao tác cơ sở dữ liệu cho tin nhắn chat
import { messageRepository } from "../repositories/message.repository";
// Import đối tượng productRepository để truy vấn thông tin sản phẩm liên kết với phòng chat
import { productRepository } from "../repositories/product.repository";
// Import lớp lỗi HttpError phục vụ ném lỗi HTTP kèm mã trạng thái
import { HttpError } from "../errors/HttpError";
// Import hàm getIO từ socket để lấy đối tượng Socket.io Server phục vụ truyền phát tin nhắn thời gian thực
import { getIO } from "../socket";
// Import đối tượng logger phục vụ việc ghi log hệ thống
import { logger } from "../utils/logger";

// Xuất đối tượng messageService chứa các logic nghiệp vụ chat, trò chuyện giữa người mua và người bán
export const messageService = {
  // Lấy lịch sử tin nhắn trong phòng chat dựa trên productId, userId người xem và vai trò của họ
  async getMessages(
    productId: string,
    userId: string,
    role: string,
    buyerIdStr?: string,
  ) {
    // Khởi tạo bộ lọc (không lọc theo productId nữa để hiển thị mọi tin nhắn của cặp người dùng này)
    const filter: any = {};

    // Nếu người xem không phải quản trị viên hệ thống (role !== "Admin")
    if (role !== "Admin") {
      // Tìm sản phẩm liên quan đến cuộc trò chuyện
      const prod = await productRepository.findById(productId);
      // Nếu sản phẩm không tồn tại, ném lỗi 404
      if (!prod) throw new HttpError(404, "Sản phẩm không tồn tại");

      // Xác định xem người xem có phải là người bán (seller) sản phẩm này hay không
      const isSeller = prod.sellerId.toString() === userId;
      // Nếu là người bán xem thì ID của đối tác (người mua) phải là buyerIdStr, ngược lại đối tác xem là chính userId
      const buyerId = isSeller ? buyerIdStr : userId;
      // Yêu cầu phải có thông tin ID của người mua để tìm phòng chat riêng tư
      if (!buyerId) {
        throw new HttpError(400, "Thiếu thông tin người mua (buyerId)");
      }

      // Thiết lập bộ lọc: tin nhắn gửi/nhận chỉ giới hạn giữa người mua và người bán sản phẩm này
      filter.$or = [
        { senderId: buyerId, receiverId: prod.sellerId.toString() },
        { senderId: prod.sellerId.toString(), receiverId: buyerId },
      ];

      // Xác định ID của đối tác trò chuyện (người nhắn) để đánh dấu đã đọc
      const partnerId = isSeller ? buyerId : prod.sellerId.toString();
      // Đánh dấu toàn bộ các tin nhắn do đối tác gửi là đã đọc đối với người xem hiện tại
      await messageRepository.markAsRead(partnerId, userId);
    } else if (buyerIdStr) {
      // Nếu người xem là Admin và có truyền ID người mua
      const prod = await productRepository.findById(productId);
      // Nếu sản phẩm tồn tại
      if (prod) {
        // Thiết lập bộ lọc lấy lịch sử trò chuyện của hai người dùng này để Admin xem xét
        filter.$or = [
          { senderId: buyerIdStr, receiverId: prod.sellerId.toString() },
          { senderId: prod.sellerId.toString(), receiverId: buyerIdStr },
        ];
      }
    }

    // Truy vấn lịch sử tin nhắn trong DB, liên kết lấy tên người gửi và sắp xếp tăng dần theo thời gian gửi
    const messages = await messageRepository.find(
      filter,
      { path: "senderId", select: "name" },
      { createdAt: 1 },
    );

    // Trả về danh sách tin nhắn chat đã được chuẩn hóa dữ liệu
    return messages.map((m: any) => ({
      id: m._id.toString(), // ID tin nhắn
      senderId: m.senderId?._id.toString(), // ID người gửi
      senderName: m.senderId?.name || "Một người dùng", // Tên hiển thị người gửi
      receiverId: m.receiverId.toString(), // ID người nhận
      content: m.content, // Nội dung tin nhắn
      imageUrl: m.imageUrl, // URL ảnh đính kèm (nếu có)
      location: m.location, // Tọa độ vị trí được chia sẻ (nếu có)
      replyTo: m.replyTo || null, // ID tin nhắn gốc nếu đây là phản hồi tin nhắn khác
      isRead: m.isRead, // Trạng thái đã đọc
      isRecalled: m.isRecalled, // Trạng thái đã thu hồi
      reaction: m.reaction, // Trạng thái cảm xúc thả vào tin nhắn
      sentAt: m.createdAt, // Thời điểm gửi
    }));
  },

  // Nghiệp vụ gửi tin nhắn mới
  async sendMessage(userId: string, data: any) {
    // Trích xuất các trường dữ liệu tin nhắn gửi từ client
    const { productId, receiverId, content, imageUrl, location, replyTo } =
      data;

    // Chặn người dùng tự gửi tin nhắn cho chính mình
    if (receiverId === userId) {
      throw new HttpError(400, "Không thể tự gửi tin nhắn cho chính mình");
    }

    // Tin nhắn phải chứa ít nhất một trong các dữ liệu: chữ viết, hình ảnh, hoặc vị trí GPS
    if (!content?.trim() && !imageUrl && !location) {
      throw new HttpError(400, "Tin nhắn không được rỗng");
    }

    // Kiểm tra sản phẩm liên kết có tồn tại và không bị xóa hay không
    const prod = await productRepository.findById(productId);
    if (!prod) {
      throw new HttpError(404, "Sản phẩm không tồn tại");
    }
    if (prod.status === "Deleted") {
      throw new HttpError(400, "Không thể gửi tin nhắn cho sản phẩm đã bị xóa");
    }

    // Cắt khoảng trắng dư thừa, làm sạch các thẻ HTML độc hại trong nội dung text và giới hạn tối đa 1000 ký tự
    const cleanContent = content
      ? content
          .trim()
          .replace(/<[^>]*>/g, "")
          .slice(0, 1000)
      : null;

    // Gọi repository lưu tin nhắn mới vào DB
    const newMsg = await messageRepository.create({
      productId,
      senderId: userId,
      receiverId,
      content: cleanContent,
      imageUrl: imageUrl || null,
      location: location || null,
      replyTo: replyTo || null, // ID tin nhắn phản hồi
    });

    try {
      if (prod) {
        // Xác định ID người mua
        const isSeller = prod.sellerId.toString() === userId;
        const buyerId = isSeller ? receiverId : userId;
        const sellerId = prod.sellerId.toString();
        // Định danh tên phòng chat Socket: chat_{buyerId}_{sellerId}
        const roomName = `chat_${buyerId}_${sellerId}`;

        // Lấy server socket.io
        const io = getIO();
        // Cấu trúc đối tượng tin nhắn phản hồi qua socket
        const messageResponse = {
          id: newMsg._id.toString(),
          productId,
          senderId: userId,
          receiverId,
          content: newMsg.content,
          imageUrl: newMsg.imageUrl,
          location: newMsg.location,
          replyTo: newMsg.replyTo || null,
          sentAt: newMsg.createdAt,
          isRead: false,
          isRecalled: false,
          reaction: null,
        };

        // Gửi (emit) tin nhắn mới cho tất cả các thành viên trong phòng chat
        io.to(roomName).emit("new_message", messageResponse);

        // Chuẩn bị nội dung hiển thị trước (preview) của thông báo
        let previewText = "Bạn có tin nhắn mới";
        if (imageUrl) previewText = "📷 [Hình ảnh]";
        else if (location) previewText = "📍 [Vị trí]";
        else if (content) previewText = content.trim().slice(0, 40);

        // Gửi thông báo tin nhắn chưa đọc đến phòng cá nhân của người nhận user_{receiverId}
        io.to(`user_${receiverId}`).emit("notification", {
          type: "new_message",
          productId,
          senderId: userId,
          preview: previewText,
        });
      }
    } catch (err) {
      // Ghi log lỗi nếu việc truyền phát socket thời gian thực gặp sự cố
      logger.error("Error emitting socket message from REST API:", err);
    }

    // Trả về bản ghi tin nhắn mới vừa lưu
    return newMsg;
  },

  // Nghiệp vụ lấy danh sách hội thoại chat (hộp thư inbox) của người dùng hiện tại
  async getConversations(userId: string, skip: number = 0, limit: number = 50) {
    // Gọi repository thực hiện truy vấn nhóm tổng hợp (Aggregation) để lấy danh sách hội thoại
    const conversations = await messageRepository.getConversationAggregation(
      userId,
      skip,
      limit,
    );

    // Chuẩn hóa và định dạng dữ liệu hội thoại trả về
    return conversations.map((conv: any) => {
      let displayMessage = conv.lastMessage;
      // Nếu tin nhắn cuối cùng không có phần text
      if (!displayMessage) {
        if (conv.lastMessageImageUrl) {
          displayMessage = "📷 [Hình ảnh]"; // Hiển thị hình ảnh
        } else if (conv.lastLocation) {
          displayMessage = "📍 [Vị trí]"; // Hiển thị chia sẻ vị trí
        } else {
          displayMessage = "";
        }
      }

      // Trả về cấu trúc thông tin cuộc hội thoại
      return {
        productId: conv.productId?.toString() || "", // ID sản phẩm liên quan
        otherUserId: conv._id.otherUserId?.toString() || "", // ID người trò chuyện cùng
        productSellerId: conv.product?.sellerId?.toString() || "", // ID người bán sản phẩm
        productName: conv.product?.name || "Sản phẩm đã bị xóa", // Tên sản phẩm
        otherUserName: conv.otherUser?.name || "Một người dùng", // Tên người trò chuyện cùng
        otherUserIsVerified: conv.otherUser?.isVerified ? 1 : 0, // Trạng thái tích xanh đối tác
        lastMessage: displayMessage, // Văn bản tin nhắn cuối cùng hiển thị
        lastMessageImageUrl: conv.lastMessageImageUrl, // Ảnh tin nhắn cuối cùng
        lastSentAt: conv.lastSentAt, // Thời điểm tin nhắn cuối cùng
        unread: conv.unreadCount || 0, // Số tin nhắn chưa đọc từ đối tác
      };
    });
  },
};

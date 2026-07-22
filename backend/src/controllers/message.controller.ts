// Import kiểu dữ liệu Request và Response từ Express
import { Request, Response } from "express";
// Import messageService chứa các logic nghiệp vụ về chat/tin nhắn
import { messageService } from "../services/message.service";
// Import messageRepository để thực hiện các thao tác truy vấn DB thô cho Tin nhắn
import { messageRepository } from "../repositories/message.repository";
// Import helpers gửi phản hồi lỗi và phân tích ID
import { sendServerError, parseId } from "../helpers/response.helper";
// Import helper upload ảnh từ buffer lên thư mục chỉ định của Cloudinary
import { uploadToCloudinary } from "../middlewares/upload";
// Import helper phân tích các tham số phân trang
import { parsePagination } from "../utils/pagination"; 
// Import Model Mongoose của Tin nhắn
import { Message } from "../models/Message";
// Import productRepository để truy vấn thông tin mẻ hàng phục vụ tìm sellerId
import { productRepository } from "../repositories/product.repository";
// Import hàm lấy đối tượng Socket.io Server (IO) để gửi sự kiện realtime
import { getIO } from "../socket";

/**
 * 1. HÀM THU HỒI TIN NHẮN (RECALL MESSAGE)
 */
export async function recallMessage(req: Request, res: Response) {
  // Lấy ID tin nhắn cần thu hồi từ tham số URL (:id)
  const { id } = req.params;
  // Lấy ID của người dùng yêu cầu thu hồi từ token xác thực
  const { userId } = req.user;

  try {
    // Tìm kiếm tin nhắn theo ID trong DB
    const msg = await Message.findById(id);
    // Nếu không tìm thấy, trả về lỗi 404
    if (!msg)
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    
    // Bảo mật: chỉ chính người gửi tin nhắn (senderId) mới có quyền thu hồi tin nhắn của họ
    if (msg.senderId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    if (msg.isRecalled) {
      return res.status(400).json({ message: "Tin nhắn này đã bị thu hồi trước đó" });
    }

    // Đánh dấu cờ 'isRecalled' thành true đại diện cho tin nhắn đã bị thu hồi
    msg.isRecalled = true;
    // Lưu trạng thái cập nhật vào DB
    await msg.save();

    // Đồng bộ Realtime trạng thái thu hồi cho cả phòng người gửi và người nhận qua Socket.io
    const prod = await productRepository.findById(msg.productId.toString());
    if (prod) {
      const sellerId = prod.sellerId.toString();
      const buyerId = msg.senderId.toString() === sellerId ? msg.receiverId.toString() : msg.senderId.toString();
      getIO()
        .to(`chat_${buyerId}_${sellerId}`)
        .emit("message_recalled", { id });
    }

    // Trả về kết quả thành công cho Client
    return res.json({ success: true, message: "Thu hồi thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/**
 * 2. HÀM THẢ CẢM XÚC TIN NHẮN (LIKE, HEART, ANGRY...)
 */
export async function reactMessage(req: Request, res: Response) {
  // Lấy ID tin nhắn từ tham số URL (:id)
  const { id } = req.params;
  // Lấy biểu tượng cảm xúc (reaction) gửi lên từ body request
  const { reaction } = req.body;
  const { userId } = req.user;

  try {
    // Tìm kiếm tin nhắn theo ID
    const msg = await Message.findById(id);
    if (!msg)
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    if (
      msg.senderId.toString() !== userId &&
      msg.receiverId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Bạn không thuộc cuộc trò chuyện này" });
    }

    if (msg.isRecalled) {
      return res.status(400).json({ message: "Không thể thả cảm xúc cho tin nhắn đã thu hồi" });
    }

    if (reaction && (typeof reaction !== "string" || reaction.length > 16)) {
      return res.status(400).json({ message: "Cảm xúc không hợp lệ" });
    }

    // Gán cảm xúc mới hoặc xóa cảm xúc (nếu không truyền gì) bằng cách gán null
    msg.reaction = reaction || null;
    await msg.save();

    // Đồng bộ cảm xúc realtime qua Socket.io tới cả hai phòng chat
    const prod = await productRepository.findById(msg.productId.toString());
    if (prod) {
      const sellerId = prod.sellerId.toString();
      const buyerId = msg.senderId.toString() === sellerId ? msg.receiverId.toString() : msg.senderId.toString();
      const eventData = { id, reaction: msg.reaction };
      getIO()
        .to(`chat_${buyerId}_${sellerId}`)
        .emit("message_reacted", eventData);
    }

    // Trả về trạng thái phản hồi cảm xúc thành công
    return res.json({ success: true, reaction: msg.reaction });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/**
 * 3. HÀM CHỈNH SỬA NỘI DUNG TIN NHẮN (EDIT MESSAGE)
 */
export async function editMessage(req: Request, res: Response) {
  // Lấy ID tin nhắn cần chỉnh sửa từ URL (:id)
  const { id } = req.params;
  // Lấy nội dung văn bản (content) mới từ body request
  const { content } = req.body;
  // Lấy ID người dùng thực hiện chỉnh sửa từ token
  const { userId } = req.user;

  if (typeof content !== "string" || !content.trim() || content.length > 1000) {
    return res.status(400).json({ message: "Tin nhắn phải có từ 1 đến 1000 ký tự" });
  }

  try {
    // Tìm kiếm tin nhắn theo ID
    const msg = await Message.findById(id);
    if (!msg)
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    
    // Bảo mật: chỉ người gửi tin nhắn mới được phép chỉnh sửa nội dung tin nhắn đó
    if (msg.senderId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không thể chỉnh sửa tin nhắn của người khác" });
    }

    if (msg.isRecalled) {
      return res.status(400).json({ message: "Không thể chỉnh sửa tin nhắn đã thu hồi" });
    }

    // Cập nhật nội dung văn bản mới
    msg.content = content.trim();
    // Lưu lại vào DB
    await msg.save();

    // Gửi sự kiện cập nhật nội dung tin nhắn realtime thông qua Socket.io
    const prod = await productRepository.findById(msg.productId.toString());
    if (prod) {
      const sellerId = prod.sellerId.toString();
      const buyerId = msg.senderId.toString() === sellerId ? msg.receiverId.toString() : msg.senderId.toString();
      const eventData = { id, content: msg.content };
      getIO()
        .to(`chat_${buyerId}_${sellerId}`)
        .emit("message_edited", eventData);
    }

    // Trả về kết quả cập nhật thành công cho Client
    return res.json({ success: true, content: msg.content });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/**
 * HÀM TRUY VẤN LỊCH SỬ CHAT CỦA MỘT SẢN PHẨM GIỮA MỘT CẶP NGƯỜI DÙNG (MUA VÀ BÁN)
 */
export async function getMessages(req: Request, res: Response) {
  // Lấy ID người dùng hiện tại và vai trò của họ từ token
  const { userId, role } = req.user;
  // Phân tích ID sản phẩm từ URL (:productId)
  const productId = parseId(req.params.productId);
  // Lấy ID người mua từ URL Query String (nếu là người bán xem tin nhắn sẽ cần truyền ID người mua)
  const buyerIdStr = req.query.buyerId as string;

  if (!productId)
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  try {
    // Gọi messageService để lấy danh sách tin nhắn giữa các đối tượng liên quan
    const messages = await messageService.getMessages(
      productId,
      userId,
      role,
      buyerIdStr,
    );
    // Trả về danh sách tin nhắn cho Client
    return res.json(messages);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

/**
 * HÀM GỬI MỘT TIN NHẮN MỚI
 */
export async function sendMessage(req: Request, res: Response) {
  // Lấy ID người gửi tin nhắn (chính là người dùng hiện tại đang login)
  const { userId } = req.user;
  try {
    // Gọi messageService để xử lý lưu tin nhắn mới vào DB và phát Socket realtime
    const newMsg = await messageService.sendMessage(userId, req.body);
    // Trả về trạng thái 201 thành công kèm thông tin ID tin nhắn và vị trí (nếu là tin nhắn chia sẻ GPS)
    return res.status(201).json({
      id: newMsg._id.toString(),
      location: newMsg.location,
      message: "Gửi thành công",
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

/**
 * HÀM LẤY DANH SÁCH CÁC CUỘC HỘI THOẠI (CONVERSATIONS) CỦA NGƯỜI DÙNG HIỆN TẠI (HỘP THƯ ĐẾN)
 */
export async function getConversations(req: Request, res: Response) {
  // Lấy ID người dùng hiện tại
  const { userId } = req.user;
  // Phân tích các tham số phân trang từ Query (page, limit) với limit tối đa mặc định là 50 cuộc hội thoại
  const { limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
    50,
  );

  try {
    // Gọi messageService lấy danh sách hội thoại có phân trang
    const list = await messageService.getConversations(userId, offset, limit);
    // Trả về danh sách hội thoại
    return res.json(list);
  } catch (err) {
    return sendServerError(res, err);
  }
}

/**
 * HÀM LẤY TỔNG SỐ TIN NHẮN CHƯA ĐỌC CỦA NGƯỜI DÙNG HIỆN TẠI
 */
export async function unreadCount(req: Request, res: Response) {
  // Lấy ID người dùng hiện tại
  const { userId } = req.user;
  try {
    // Đếm số lượng tin nhắn chưa đọc trong DB nơi người nhận là userId
    const count = await messageRepository.countUnread(userId);
    // Trả về số lượng tin nhắn chưa đọc
    return res.json({ count });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/**
 * HÀM TẢI ẢNH LÊN CLOUDINARY KHI GỬI ẢNH TRONG KHUNG CHAT (Tải lên tức thời để lấy URL ảnh chèn vào tin nhắn)
 */
export async function uploadChatImage(req: Request, res: Response) {
  // Kiểm tra xem Multer đã xử lý và lưu file vào bộ nhớ đệm (req.file) chưa
  if (!req.file)
    return res.status(400).json({ message: "Chưa chọn file ảnh gửi kèm" });

  try {
    // Tải ảnh từ buffer lên Cloudinary trong thư mục chuyên biệt 'chat_images'
    const { url } = await uploadToCloudinary(req.file.buffer, "chat_images");
    // Trả về URL ảnh đã upload trên Cloudinary cho Client
    return res.json({ imageUrl: url });
  } catch (err) {
    return sendServerError(res, err);
  }
}


import { Request, Response } from "express";
import { messageService } from "../services/message.service";
import { messageRepository } from "../repositories/message.repository";
import { sendServerError, parseId } from "../helpers/response.helper";
import { uploadToCloudinary } from "../middlewares/upload";
import { parsePagination } from "../utils/pagination"; // [FIX PERFORMANCE 2]
import { Message } from "../models/Message";
import { getIO } from "../socket";
// 1. Thu hồi tin nhắn
export async function recallMessage(req: Request, res: Response) {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const msg = await Message.findById(id);
    if (!msg)
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    if (msg.senderId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    msg.isRecalled = true;
    await msg.save();

    // Đồng bộ Realtime qua Socket
    getIO()
      .to(`product_${msg.productId}_${msg.senderId}`)
      .emit("message_recalled", { id });
    getIO()
      .to(`product_${msg.productId}_${msg.receiverId}`)
      .emit("message_recalled", { id });

    return res.json({ success: true, message: "Thu hồi thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

// 2. Thả cảm xúc tin nhắn
export async function reactMessage(req: Request, res: Response) {
  const { id } = req.params;
  const { reaction } = req.body;

  try {
    const msg = await Message.findById(id);
    if (!msg)
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    msg.reaction = reaction || null;
    await msg.save();

    // Đồng bộ Realtime cảm xúc qua Socket
    const eventData = { id, reaction: msg.reaction };
    getIO()
      .to(`product_${msg.productId}_${msg.senderId}`)
      .emit("message_reacted", eventData);
    getIO()
      .to(`product_${msg.productId}_${msg.receiverId}`)
      .emit("message_reacted", eventData);

    return res.json({ success: true, reaction: msg.reaction });
  } catch (err) {
    return sendServerError(res, err);
  }
}

// 3. Chỉnh sửa tin nhắn
export async function editMessage(req: Request, res: Response) {
  const { id } = req.params;
  const { content } = req.body;
  const { userId } = req.user;

  try {
    const msg = await Message.findById(id);
    if (!msg)
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    if (msg.senderId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không thể chỉnh sửa tin nhắn của người khác" });
    }

    msg.content = content;
    await msg.save();

    // Đồng bộ nội dung sửa qua Socket
    const eventData = { id, content };
    getIO()
      .to(`product_${msg.productId}_${msg.senderId}`)
      .emit("message_edited", eventData);
    getIO()
      .to(`product_${msg.productId}_${msg.receiverId}`)
      .emit("message_edited", eventData);

    return res.json({ success: true, content });
  } catch (err) {
    return sendServerError(res, err);
  }
}
export async function getMessages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseId(req.params.productId);
  const buyerIdStr = req.query.buyerId as string;

  if (!productId)
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  try {
    const messages = await messageService.getMessages(
      productId,
      userId,
      role,
      buyerIdStr,
    );
    return res.json(messages);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function sendMessage(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const newMsg = await messageService.sendMessage(userId, req.body);
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

export async function getConversations(req: Request, res: Response) {
  const { userId } = req.user;
  // [FIX PERFORMANCE 2] Phân trang aggregation
  const { limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
    50,
  );

  try {
    const list = await messageService.getConversations(userId, offset, limit);
    return res.json(list);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function unreadCount(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const count = await messageRepository.countUnread(userId);
    return res.json({ count });
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

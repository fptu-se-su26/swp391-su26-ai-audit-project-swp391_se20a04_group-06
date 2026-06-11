import { Request, Response } from "express";
import { notificationRepository } from "../repositories/notification.repository";
import { broadcastLogRepository } from "../repositories/broadcastlog.repository";
import { broadcastToUsers } from "../services/notification.service";
import { sendServerError, parseId } from "../helpers/response.helper";
import { parsePagination } from "../utils/pagination";
import mongoose from "mongoose";
import { Notification } from "../models/Notification";

export async function getNotifications(req: Request, res: Response) {
  const { userId } = req.user;

  // Tích hợp hệ thống phân trang chuẩn hóa tránh nghẽn tải dữ liệu
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
    100,
  );

  try {
    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    const formattedRows = notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      content: n.content,
      isRead: n.isRead ? 1 : 0,
      createdAt: n.createdAt,
      productId: n.productId?.toString() || null,
      reviewId: n.reviewId?.toString() || null,
    }));

    return res.json({
      data: formattedRows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

const VALID_TARGET_ROLES = new Set(["all", "Seller", "Buyer"]);

export async function broadcastNotification(req: Request, res: Response) {
  const { userId } = req.user;
  const { content, targetRole = "all" } = req.body;

  if (!content?.trim())
    return res
      .status(400)
      .json({ message: "Nội dung thông báo không được để trống" });

  if (content.trim().length > 200)
    return res.status(400).json({ message: "Nội dung tối đa 200 ký tự" });

  if (!VALID_TARGET_ROLES.has(targetRole))
    return res.status(400).json({ message: "Đối tượng nhận không hợp lệ" });

  try {
    const result = await broadcastToUsers({
      adminId: userId,
      content: content.trim(),
      targetRole,
    });
    return res.json(result);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getBroadcastHistory(req: Request, res: Response) {
  try {
    const logs = await broadcastLogRepository.findRecent();

    return res.json(
      logs.map((l) => ({
        id: l._id.toString(),
        content: l.content,
        targetRole: l.targetRole,
        sentCount: l.sentCount,
        createdAt: l.createdAt,
      })),
    );
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function markAllAsRead(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    await notificationRepository.markAllAsRead(userId);
    return res.json({ message: "Đã đánh dấu đọc toàn bộ thông báo" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function markSingleAsRead(req: Request, res: Response) {
  const { userId } = req.user;
  const notifId = parseId(req.params.id);

  if (!notifId)
    return res.status(400).json({ message: "ID thông báo không hợp lệ" });

  try {
    const notif = await notificationRepository.findOne(notifId, userId);
    if (!notif)
      return res.status(404).json({ message: "Không tìm thấy thông báo" });

    notif.isRead = true;
    await notif.save();

    return res.json({ message: "Đã đánh dấu đọc thông báo" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

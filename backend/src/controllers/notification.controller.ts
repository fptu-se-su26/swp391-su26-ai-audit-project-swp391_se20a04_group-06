import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { sendServerError, parseId } from "../helpers/response.helper";
import { BroadcastLog } from "../models/BroadcastLog";
import { broadcastToUsers } from "../services/notification.service";

export async function getNotifications(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedRows = notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      content: n.content,
      isRead: n.isRead ? 1 : 0,
      createdAt: n.createdAt,
      productId: n.productId?.toString() || null,
      reviewId: n.reviewId?.toString() || null,
    }));

    return res.json(formattedRows);
  } catch (err) {
    return sendServerError(res, err);
  }
}
/**
 * Thêm vào cuối notification.controller.ts.
 * Nhớ import thêm ở đầu file:
 *   import { broadcastToUsers } from "../services/notification.service";
 *   import { BroadcastLog }    from "../models/BroadcastLog";
 */

const VALID_TARGET_ROLES = new Set(["all", "Seller", "Buyer"]);

/* ─── POST /api/admin/notifications/broadcast ─── */
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

/* ─── GET /api/admin/notifications/broadcasts ─── */
export async function getBroadcastHistory(req: Request, res: Response) {
  try {
    const logs = await BroadcastLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

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
    await Notification.updateMany({ userId }, { $set: { isRead: true } });
    return res.json({ message: "Đã đánh dấu đọc toàn bộ thông báo" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── PATCH /api/notifications/:id ─── */
export async function markSingleAsRead(req: Request, res: Response) {
  const { userId } = req.user;
  const notifId = parseId(req.params.id);

  if (!notifId)
    return res.status(400).json({ message: "ID thông báo không hợp lệ" });

  try {
    const notif = await Notification.findOne({ _id: notifId, userId });
    if (!notif)
      return res.status(404).json({ message: "Không tìm thấy thông báo" });

    notif.isRead = true;
    await notif.save();

    return res.json({ message: "Đã đánh dấu đọc thông báo" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { sendServerError, parseId } from "../helpers/response.helper";

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
      reviewId: n.reviewId?.toString() || null
    }));

    return res.json(formattedRows);
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

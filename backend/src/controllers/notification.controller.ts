import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
import { sendServerError } from '../helpers/response.helper';

export async function getNotifications(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        NotificationID AS id, Type AS type, Content AS content,
        IsRead AS isRead, CreatedAt AS createdAt,
        ProductID AS productId, ReviewID AS reviewId
       FROM Notification
       WHERE UserID = ?
       ORDER BY CreatedAt DESC
       LIMIT 50`,
      [userId],
    );
    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function markAllAsRead(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    await pool.query('UPDATE Notification SET IsRead = 1 WHERE UserID = ?', [userId]);
    return res.json({ message: 'Đã đánh dấu đọc toàn bộ thông báo' });
  } catch (err) {
    return sendServerError(res, err);
  }
}

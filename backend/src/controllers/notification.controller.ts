import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

export async function getNotifications(req: Request, res: Response) {
  const userId = (req as any).user.userId;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT NotificationID AS id, Type AS type, Content AS content, IsRead AS isRead, CreatedAt AS createdAt, ProductID AS productId, ReviewID AS reviewId 
       FROM Notification 
       WHERE UserID = ? 
       ORDER BY CreatedAt DESC 
       LIMIT 50`,
      [userId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function markAllAsRead(req: Request, res: Response) {
  const userId = (req as any).user.userId;

  try {
    await pool.query(
      'UPDATE Notification SET IsRead = 1 WHERE UserID = ?',
      [userId]
    );
    res.json({ message: 'Đã đánh dấu đọc toàn bộ thông báo' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

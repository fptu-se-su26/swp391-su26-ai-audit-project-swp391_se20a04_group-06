import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { sendServerError } from '../helpers/response.helper';

/**
 * Report Controller
 * Clean: dùng sendServerError nhất quán thay vì inline res.status(500).
 */

export async function createReport(req: Request, res: Response) {
  const { userId } = req.user;
  const productId = parseInt(req.params.productId, 10);
  const { reason } = req.body;

  if (!productId || !reason)
    return res.status(400).json({ message: 'Thiếu thông tin' });

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT ReportID FROM Report WHERE ReporterID = ? AND ProductID = ?',
      [userId, productId],
    );
    if ((existing as RowDataPacket[]).length > 0)
      return res.status(400).json({ message: 'Bạn đã báo cáo bài đăng này rồi' });

    await pool.query(
      'INSERT INTO Report (ReporterID, ProductID, Reason) VALUES (?, ?, ?)',
      [userId, productId, reason],
    );
    return res.json({ message: 'Báo cáo đã gửi thành công' });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getReports(req: Request, res: Response) {
  const { status = 'Pending' } = req.query as Record<string, string>;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.ReportID AS id, r.Reason AS reason, r.Status AS status,
              r.AdminNote AS adminNote, r.CreatedAt AS createdAt,
              u.Name AS reporterName,
              p.Name AS productName, p.ProductID AS productId,
              p.SellerID AS sellerId, s.Name AS sellerName
       FROM Report r
       JOIN User u ON u.UserID = r.ReporterID
       JOIN Product p ON p.ProductID = r.ProductID
       JOIN User s ON s.UserID = p.SellerID
       WHERE r.Status = ?
       ORDER BY r.CreatedAt DESC
       LIMIT 100`,
      [status],
    );
    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function handleReport(req: Request, res: Response) {
  const reportId = parseInt(req.params.id, 10);
  const { action, adminNote } = req.body;

  if (!reportId || !action)
    return res.status(400).json({ message: 'Thiếu thông tin' });

  const newStatus = action === 'resolve' ? 'Resolved' : 'Dismissed';
  try {
    if (action === 'resolve') {
      const [report] = await pool.query<RowDataPacket[]>(
        'SELECT ProductID FROM Report WHERE ReportID = ?', [reportId],
      );
      if ((report as RowDataPacket[])[0]) {
        await pool.query(
          "UPDATE Product SET Status = 'Deleted' WHERE ProductID = ?",
          [(report as RowDataPacket[])[0].ProductID],
        );
      }
    }
    await pool.query(
      'UPDATE Report SET Status = ?, AdminNote = ? WHERE ReportID = ?',
      [newStatus, adminNote || null, reportId],
    );
    return res.json({ message: 'Đã xử lý báo cáo' });
  } catch (err) {
    return sendServerError(res, err);
  }
}

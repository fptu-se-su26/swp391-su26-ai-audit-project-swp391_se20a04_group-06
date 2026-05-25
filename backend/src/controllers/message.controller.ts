import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { sendServerError, parseId } from '../helpers/response.helper';

/* ─── GET /api/messages/:productId ─── */
export async function getMessages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseId(req.params.productId);
  if (!productId) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        m.MessageID AS id, m.SenderID AS senderId, u.Name AS senderName,
        m.ReceiverID AS receiverId, m.Content AS content, m.IsRead AS isRead, m.SentAt AS sentAt
       FROM Message m
       JOIN User u ON u.UserID = m.SenderID
       WHERE m.ProductID = ?
         AND (? = 'Admin' OR m.SenderID = ? OR m.ReceiverID = ?)
       ORDER BY m.SentAt ASC`,
      [productId, role, userId, userId],
    );

    await pool.query(
      'UPDATE Message SET IsRead = 1 WHERE ProductID = ? AND ReceiverID = ? AND IsRead = 0',
      [productId, userId],
    );

    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── POST /api/messages ─── REST fallback */
export async function sendMessage(req: Request, res: Response) {
  const { userId } = req.user;
  const { productId, receiverId, content } = req.body;

  if (!productId || !receiverId || !content?.trim())
    return res.status(400).json({ message: 'Thiếu productId, receiverId hoặc nội dung tin' });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO Message (ProductID, SenderID, ReceiverID, Content) VALUES (?, ?, ?, ?)',
      [productId, userId, receiverId, content.trim()],
    );
    return res.status(201).json({ id: result.insertId, message: 'Gửi thành công' });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── GET /api/messages/unread-count ─── */
export async function unreadCount(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM Message WHERE ReceiverID = ? AND IsRead = 0',
      [userId],
    );
    return res.json({ count: (rows[0] as any).cnt });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── GET /api/messages/conversations ─── */
export async function getConversations(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        conv.productId,
        conv.otherUserId,
        p.Name   AS productName,
        u.Name   AS otherUserName,
        u.IsVerified AS otherUserIsVerified,
        last_msg.Content AS lastMessage,
        last_msg.SentAt  AS lastSentAt,
        (
          SELECT COUNT(*) FROM Message m2
          WHERE m2.ProductID = conv.productId
            AND m2.ReceiverID = ?
            AND (CASE WHEN m2.SenderID = ? THEN m2.ReceiverID ELSE m2.SenderID END) = conv.otherUserId
            AND m2.IsRead = 0
        ) AS unread
       FROM (
         SELECT
           m.ProductID AS productId,
           CASE WHEN m.SenderID = ? THEN m.ReceiverID ELSE m.SenderID END AS otherUserId,
           MAX(m.MessageID) AS lastMsgId
         FROM Message m
         WHERE m.SenderID = ? OR m.ReceiverID = ?
         GROUP BY m.ProductID, otherUserId
       ) conv
       JOIN Message   last_msg ON last_msg.MessageID = conv.lastMsgId
       JOIN Product   p        ON p.ProductID = conv.productId
       JOIN User      u        ON u.UserID    = conv.otherUserId
       ORDER BY last_msg.SentAt DESC`,
      [userId, userId, userId, userId, userId],
    );
    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

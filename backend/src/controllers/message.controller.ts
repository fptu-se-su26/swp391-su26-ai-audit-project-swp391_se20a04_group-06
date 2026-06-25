import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
<<<<<<< HEAD

/* ─── GET /api/messages/:productId ──────────────────────────
   Lấy toàn bộ tin nhắn của 1 cuộc trò chuyện (product).
   Chỉ người trong cuộc (buyer / seller) hoặc Admin mới xem được.
──────────────────────────────────────────────────────────── */
export async function getMessages(req: Request, res: Response) {
  const userId    = (req as any).user.userId;
  const role      = (req as any).user.role;
  const productId = req.params.productId;
=======
import { sendServerError, parseId } from '../helpers/response.helper';

/* ─── GET /api/messages/:productId ─── */
export async function getMessages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseId(req.params.productId);
  if (!productId) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
>>>>>>> origin/main

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

<<<<<<< HEAD
    /* Đánh dấu đã đọc cho tin nhắn gửi đến userId */
=======
>>>>>>> origin/main
    await pool.query(
      'UPDATE Message SET IsRead = 1 WHERE ProductID = ? AND ReceiverID = ? AND IsRead = 0',
      [productId, userId],
    );

    return res.json(rows);
  } catch (err) {
<<<<<<< HEAD
    console.error(err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/* ─── POST /api/messages ─── REST fallback (Socket.IO là chính) */
export async function sendMessage(req: Request, res: Response) {
  const userId                    = (req as any).user.userId;
=======
    return sendServerError(res, err);
  }
}

/* ─── POST /api/messages ─── REST fallback */
export async function sendMessage(req: Request, res: Response) {
  const { userId } = req.user;
>>>>>>> origin/main
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
<<<<<<< HEAD
    console.error(err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/* ─── GET /api/messages/unread-count ─── Số tin chưa đọc của user */
export async function unreadCount(req: Request, res: Response) {
  const userId = (req as any).user.userId;
=======
    return sendServerError(res, err);
  }
}

/* ─── GET /api/messages/unread-count ─── */
export async function unreadCount(req: Request, res: Response) {
  const { userId } = req.user;
>>>>>>> origin/main
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM Message WHERE ReceiverID = ? AND IsRead = 0',
      [userId],
    );
<<<<<<< HEAD
    return res.json({ count: rows[0].cnt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/* ─── GET /api/messages/conversations ─── Danh sách các cuộc trò chuyện gần đây */
export async function getConversations(req: Request, res: Response) {
  const userId = (req as any).user.userId;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        m.ProductID as productId,
        p.Name as productName,
        CASE WHEN m.SenderID = ? THEN m.ReceiverID ELSE m.SenderID END as otherUserId,
        u.Name as otherUserName,
        SUBSTRING_INDEX(GROUP_CONCAT(m.Content ORDER BY m.SentAt DESC SEPARATOR '|||'), '|||', 1) as lastMessage,
        MAX(m.SentAt) as lastSentAt,
        SUM(CASE WHEN m.ReceiverID = ? AND m.IsRead = 0 THEN 1 ELSE 0 END) as unread
       FROM Message m
       JOIN Product p ON p.ProductID = m.ProductID
       JOIN User u ON u.UserID = (CASE WHEN m.SenderID = ? THEN m.ReceiverID ELSE m.SenderID END)
       WHERE m.SenderID = ? OR m.ReceiverID = ?
       GROUP BY m.ProductID, otherUserId, u.Name, p.Name
       ORDER BY lastSentAt DESC`,
=======
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
>>>>>>> origin/main
      [userId, userId, userId, userId, userId],
    );
    return res.json(rows);
  } catch (err) {
<<<<<<< HEAD
    console.error(err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
=======
    return sendServerError(res, err);
>>>>>>> origin/main
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.unreadCount = unreadCount;
exports.getConversations = getConversations;
const db_1 = require("../db");
/* ─── GET /api/messages/:productId ──────────────────────────
   Lấy toàn bộ tin nhắn của 1 cuộc trò chuyện (product).
   Chỉ người trong cuộc (buyer / seller) hoặc Admin mới xem được.
──────────────────────────────────────────────────────────── */
async function getMessages(req, res) {
    const userId = req.user.userId;
    const role = req.user.role;
    const productId = req.params.productId;
    try {
        const [rows] = await db_1.pool.query(`SELECT
        m.MessageID AS id, m.SenderID AS senderId, u.Name AS senderName,
        m.ReceiverID AS receiverId, m.Content AS content, m.IsRead AS isRead, m.SentAt AS sentAt
       FROM Message m
       JOIN User u ON u.UserID = m.SenderID
       WHERE m.ProductID = ?
         AND (? = 'Admin' OR m.SenderID = ? OR m.ReceiverID = ?)
       ORDER BY m.SentAt ASC`, [productId, role, userId, userId]);
        /* Đánh dấu đã đọc cho tin nhắn gửi đến userId */
        await db_1.pool.query('UPDATE Message SET IsRead = 1 WHERE ProductID = ? AND ReceiverID = ? AND IsRead = 0', [productId, userId]);
        return res.json(rows);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── POST /api/messages ─── REST fallback (Socket.IO là chính) */
async function sendMessage(req, res) {
    const userId = req.user.userId;
    const { productId, receiverId, content } = req.body;
    if (!productId || !receiverId || !content?.trim())
        return res.status(400).json({ message: 'Thiếu productId, receiverId hoặc nội dung tin' });
    try {
        const [result] = await db_1.pool.query('INSERT INTO Message (ProductID, SenderID, ReceiverID, Content) VALUES (?, ?, ?, ?)', [productId, userId, receiverId, content.trim()]);
        return res.status(201).json({ id: result.insertId, message: 'Gửi thành công' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── GET /api/messages/unread-count ─── Số tin chưa đọc của user */
async function unreadCount(req, res) {
    const userId = req.user.userId;
    try {
        const [rows] = await db_1.pool.query('SELECT COUNT(*) AS cnt FROM Message WHERE ReceiverID = ? AND IsRead = 0', [userId]);
        return res.json({ count: rows[0].cnt });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── GET /api/messages/conversations ─── Danh sách các cuộc trò chuyện gần đây */
async function getConversations(req, res) {
    const userId = req.user.userId;
    try {
        const [rows] = await db_1.pool.query(`SELECT 
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
       ORDER BY lastSentAt DESC`, [userId, userId, userId, userId, userId]);
        return res.json(rows);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}

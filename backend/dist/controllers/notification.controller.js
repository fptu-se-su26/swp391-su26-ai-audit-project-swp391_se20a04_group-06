"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAllAsRead = markAllAsRead;
const db_1 = require("../db");
async function getNotifications(req, res) {
    const userId = req.user.userId;
    try {
        const [rows] = await db_1.pool.query(`SELECT NotificationID AS id, Type AS type, Content AS content, IsRead AS isRead, CreatedAt AS createdAt, ProductID AS productId 
       FROM Notification 
       WHERE UserID = ? 
       ORDER BY CreatedAt DESC 
       LIMIT 50`, [userId]);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
async function markAllAsRead(req, res) {
    const userId = req.user.userId;
    try {
        await db_1.pool.query('UPDATE Notification SET IsRead = 1 WHERE UserID = ?', [userId]);
        res.json({ message: 'Đã đánh dấu đọc toàn bộ thông báo' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFollow = toggleFollow;
exports.checkFollow = checkFollow;
const db_1 = require("../db");
async function toggleFollow(req, res) {
    const followerId = req.user.userId;
    const sellerId = parseInt(req.params.sellerId);
    if (!sellerId) {
        return res.status(400).json({ message: 'Thiếu ID người bán' });
    }
    if (followerId === sellerId) {
        return res.status(400).json({ message: 'Không thể tự follow chính mình' });
    }
    try {
        const [rows] = await db_1.pool.query('SELECT FollowID FROM Follow WHERE FollowerID = ? AND SellerID = ?', [followerId, sellerId]);
        if (rows.length > 0) {
            // Đã follow -> Hủy follow
            await db_1.pool.query('DELETE FROM Follow WHERE FollowID = ?', [rows[0].FollowID]);
            return res.json({ message: 'Đã hủy theo dõi', isFollowing: false });
        }
        else {
            // Chưa follow -> Thêm follow
            await db_1.pool.query('INSERT INTO Follow (FollowerID, SellerID) VALUES (?, ?)', [followerId, sellerId]);
            return res.json({ message: 'Đã theo dõi thành công', isFollowing: true });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
async function checkFollow(req, res) {
    const followerId = req.user.userId;
    const sellerId = parseInt(req.params.sellerId);
    if (!sellerId) {
        return res.status(400).json({ message: 'Thiếu ID người bán' });
    }
    try {
        const [rows] = await db_1.pool.query('SELECT FollowID FROM Follow WHERE FollowerID = ? AND SellerID = ?', [followerId, sellerId]);
        return res.json({ isFollowing: rows.length > 0 });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

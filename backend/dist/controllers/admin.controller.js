"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.toggleUser = toggleUser;
exports.listAllProducts = listAllProducts;
exports.adminDeleteProduct = adminDeleteProduct;
exports.getStats = getStats;
const db_1 = require("../db");
const upload_1 = require("../middlewares/upload");
/* ─── GET /api/admin/users ─── Danh sách toàn bộ users */
async function listUsers(req, res) {
    try {
        const [rows] = await db_1.pool.query(`SELECT
        u.UserID AS id, u.Name AS name, u.Phone AS phone, u.Role AS role,
        u.IsActive AS isActive, u.CreatedAt AS createdAt,
        (SELECT COUNT(*) FROM Product p WHERE p.SellerID = u.UserID AND p.Status != 'Deleted') AS postCount
       FROM User u
       ORDER BY u.CreatedAt DESC`);
        return res.json(rows);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── PATCH /api/admin/users/:id/toggle ─── Khoá / Mở khoá */
async function toggleUser(req, res) {
    try {
        const [rows] = await db_1.pool.query('SELECT IsActive FROM User WHERE UserID = ?', [req.params.id]);
        if (!rows[0])
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (rows[0].IsActive === 1 && req.user.role !== 'Admin')
            return res.status(403).json({ message: 'Chỉ Admin mới có thể khoá tài khoản' });
        const newStatus = rows[0].IsActive ? 0 : 1;
        await db_1.pool.query('UPDATE User SET IsActive = ? WHERE UserID = ?', [newStatus, req.params.id]);
        return res.json({ isActive: !!newStatus, message: newStatus ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── GET /api/admin/listings ─── Tất cả bài đăng (Admin) */
async function listAllProducts(req, res) {
    try {
        const [rows] = await db_1.pool.query(`SELECT
        p.ProductID AS id, p.Type AS type, p.Name AS name, p.Price AS price,
        p.SalesType AS salesType, p.RemainingWeight AS remainingWeight,
        p.Status AS status, p.CreatedAt AS createdAt,
        u.Name AS sellerName, u.Phone AS sellerPhone
       FROM Product p
       JOIN User u ON u.UserID = p.SellerID
       WHERE p.Status != 'Deleted'
       ORDER BY p.CreatedAt DESC`);
        return res.json(rows);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── DELETE /api/admin/listings/:id ─── Admin xoá bài bất kỳ */
async function adminDeleteProduct(req, res) {
    try {
        /* Xoá ảnh trên Cloudinary trước */
        const [images] = await db_1.pool.query('SELECT PublicID FROM ProductImage WHERE ProductID = ?', [req.params.id]);
        await Promise.all(images.map(img => (0, upload_1.deleteFromCloudinary)(img.PublicID)));
        await db_1.pool.query('UPDATE Product SET Status = "Deleted" WHERE ProductID = ?', [req.params.id]);
        return res.json({ message: 'Đã xoá bài đăng' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── GET /api/admin/stats ─── Thống kê tổng quan */
async function getStats(req, res) {
    try {
        const [[users]] = await db_1.pool.query('SELECT COUNT(*) AS cnt FROM User');
        const [[fresh]] = await db_1.pool.query("SELECT COUNT(*) AS cnt FROM Product WHERE Type='Fresh' AND Status='Active'");
        const [[dried]] = await db_1.pool.query("SELECT COUNT(*) AS cnt FROM Product WHERE Type='Dried' AND Status='Active'");
        const [[expired]] = await db_1.pool.query("SELECT COUNT(*) AS cnt FROM Product WHERE Status='Expired'");
        const [[messages]] = await db_1.pool.query('SELECT COUNT(*) AS cnt FROM Message');
        return res.json({
            totalUsers: users.cnt,
            activeFresh: fresh.cnt,
            activeDried: dried.cnt,
            expiredTotal: expired.cnt,
            totalMessages: messages.cnt,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}

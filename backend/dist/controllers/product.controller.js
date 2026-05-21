"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.getMyProducts = getMyProducts;
const db_1 = require("../db");
const haversine_1 = require("../utils/haversine");
const socket_1 = require("../socket");
/* ─── GET /api/products ──────────────────────────────────────
   Query params:
     type       = Fresh | Dried
     lat, lng   = vị trí buyer (để lọc hải sản tươi theo 20km)
     search     = tìm theo tên
     page       = trang (mặc định 1)
     limit      = số bản ghi / trang (mặc định 20)
──────────────────────────────────────────────────────────── */
async function getProducts(req, res) {
    try {
        const { type, lat, lng, search, page = '1', limit = '20' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let sql = `
      SELECT
        p.ProductID AS id, p.SellerID AS sellerId, u.Name AS sellerName, u.Phone AS sellerPhone,
        p.Type AS type, p.Name AS name, p.Description AS description, p.Price AS price,
        p.SalesType AS salesType, p.TotalWeight AS totalWeight, p.RemainingWeight AS remainingWeight,
        p.Status AS status, p.CatchTime AS catchTime, p.Lat AS lat, p.Lng AS lng,
        p.Origin AS origin, p.ExpiryDate AS expiryDate, p.CreatedAt AS createdAt,
        (SELECT COUNT(*) FROM ProductImage pi WHERE pi.ProductID = p.ProductID) AS imgCount,
        (SELECT CloudinaryURL FROM ProductImage pi WHERE pi.ProductID = p.ProductID ORDER BY SortOrder LIMIT 1) AS coverImg
      FROM Product p
      JOIN User u ON u.UserID = p.SellerID
      WHERE p.Status = 'Active'
    `;
        const params = [];
        if (type === 'Fresh' || type === 'Dried') {
            sql += ' AND p.Type = ?';
            params.push(type);
        }
        if (search) {
            sql += ' AND p.Name LIKE ?';
            params.push(`%${search}%`);
        }
        sql += ' ORDER BY p.CreatedAt DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);
        const [rows] = await db_1.pool.query(sql, params);
        /* Lọc hải sản tươi theo khoảng cách Haversine nếu buyer gửi GPS */
        let products = rows;
        if (type === 'Fresh' && lat && lng) {
            const bLat = parseFloat(lat);
            const bLng = parseFloat(lng);
            products = products.filter(p => {
                if (!p.lat || !p.lng)
                    return false;
                return (0, haversine_1.haversineKm)(bLat, bLng, p.lat, p.lng) <= haversine_1.MAX_FRESH_DISTANCE_KM;
            });
        }
        return res.json({ data: products, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── GET /api/products/:id ─── */
async function getProductById(req, res) {
    try {
        const [rows] = await db_1.pool.query(`SELECT
        p.ProductID AS id, p.SellerID AS sellerId, u.Name AS sellerName, u.Phone AS sellerPhone,
        p.Type AS type, p.Name AS name, p.Description AS description, p.Price AS price,
        p.SalesType AS salesType, p.TotalWeight AS totalWeight, p.RemainingWeight AS remainingWeight,
        p.Status AS status, p.CatchTime AS catchTime, p.Lat AS lat, p.Lng AS lng,
        p.Origin AS origin, p.ExpiryDate AS expiryDate, p.CreatedAt AS createdAt,
        COALESCE((SELECT AVG(Rating) FROM Review r WHERE r.SellerID = p.SellerID), 0) AS sellerRating,
        (SELECT COUNT(*) FROM Review r WHERE r.SellerID = p.SellerID) AS ratingCount
       FROM Product p
       JOIN User u ON u.UserID = p.SellerID
       WHERE p.ProductID = ?`, [req.params.id]);
        if (!rows[0])
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        /* Kèm danh sách ảnh */
        const [images] = await db_1.pool.query('SELECT ImageID AS id, CloudinaryURL AS url, SortOrder FROM ProductImage WHERE ProductID = ? ORDER BY SortOrder', [req.params.id]);
        return res.json({ ...rows[0], images });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── POST /api/products ─── (yêu cầu đăng nhập) */
async function createProduct(req, res) {
    const userId = req.user.userId;
    const { type, name, description, price, salesType, totalWeight, catchTime, lat, lng, origin, expiryDate } = req.body;
    if (!type || !name || !price || !totalWeight)
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: loại, tên, giá, khối lượng' });
    if (type === 'Fresh' && (!lat || !lng))
        return res.status(400).json({ message: 'Hải sản tươi bắt buộc phải có toạ độ GPS' });
    try {
        const [result] = await db_1.pool.query(`INSERT INTO Product
        (SellerID, Type, Name, Description, Price, SalesType, TotalWeight, RemainingWeight, CatchTime, Lat, Lng, Origin, ExpiryDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId, type, name.trim(), description ?? null,
            parseInt(price), salesType ?? 'Retail',
            parseFloat(totalWeight), parseFloat(totalWeight), // RemainingWeight = TotalWeight lúc mới đăng
            catchTime ?? null, lat ?? null, lng ?? null,
            origin ?? null, expiryDate ?? null,
        ]);
        const productId = result.insertId;
        // Lấy thông tin người bán
        const [userRows] = await db_1.pool.query('SELECT Name FROM User WHERE UserID = ?', [userId]);
        const sellerName = userRows[0]?.Name || 'Một ngư dân';
        // Phát thông báo cho những người follow
        const [followers] = await db_1.pool.query('SELECT FollowerID FROM Follow WHERE SellerID = ?', [userId]);
        const io = (0, socket_1.getIO)();
        for (const f of followers) {
            const previewText = `${sellerName} vừa đăng mẻ hải sản mới: ${name}`;
            try {
                // 1. Lưu vào CSDL
                await db_1.pool.query('INSERT INTO Notification (UserID, Type, Content, ProductID) VALUES (?, ?, ?, ?)', [f.FollowerID, 'new_product', previewText, Number(productId)]);
                // 2. Phát Socket.IO
                io.to(`user_${f.FollowerID}`).emit('notification', {
                    type: 'new_product',
                    productId,
                    sellerId: userId,
                    preview: previewText,
                });
            }
            catch (errNotif) {
                console.error('Lỗi khi lưu/phát thông báo sản phẩm mới:', errNotif);
            }
        }
        return res.status(201).json({ message: 'Đăng bài thành công', productId });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── PUT /api/products/:id ─── (chủ bài hoặc admin) */
async function updateProduct(req, res) {
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const [rows] = await db_1.pool.query('SELECT SellerID FROM Product WHERE ProductID = ?', [req.params.id]);
        if (!rows[0])
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        if (role !== 'Admin' && rows[0].SellerID !== userId)
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài đăng này' });
        const { name, description, price, salesType, remainingWeight, status, origin, expiryDate } = req.body;
        await db_1.pool.query(`UPDATE Product SET
        Name = COALESCE(?, Name),
        Description = COALESCE(?, Description),
        Price = COALESCE(?, Price),
        SalesType = COALESCE(?, SalesType),
        RemainingWeight = COALESCE(?, RemainingWeight),
        Status = COALESCE(?, Status),
        Origin = COALESCE(?, Origin),
        ExpiryDate = COALESCE(?, ExpiryDate)
       WHERE ProductID = ?`, [name, description, price, salesType, remainingWeight, status, origin, expiryDate, req.params.id]);
        return res.json({ message: 'Cập nhật thành công' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── DELETE /api/products/:id ─── (chủ bài hoặc admin) */
async function deleteProduct(req, res) {
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const [rows] = await db_1.pool.query('SELECT SellerID FROM Product WHERE ProductID = ?', [req.params.id]);
        if (!rows[0])
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        if (role !== 'Admin' && rows[0].SellerID !== userId)
            return res.status(403).json({ message: 'Bạn không có quyền xoá bài đăng này' });
        await db_1.pool.query('UPDATE Product SET Status = "Deleted" WHERE ProductID = ?', [req.params.id]);
        return res.json({ message: 'Đã xoá bài đăng' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── GET /api/products/my ─── Bài đăng của chính người dùng (Dashboard) */
async function getMyProducts(req, res) {
    const userId = req.user.userId;
    try {
        const [rows] = await db_1.pool.query(`SELECT
        p.ProductID AS id, p.Type AS type, p.Name AS name, p.Price AS price,
        p.SalesType AS salesType, p.TotalWeight AS totalWeight, p.RemainingWeight AS remainingWeight,
        p.Status AS status, p.CatchTime AS catchTime, p.Origin AS origin, p.ExpiryDate AS expiryDate,
        p.CreatedAt AS createdAt,
        (SELECT COUNT(*) FROM ProductImage pi WHERE pi.ProductID = p.ProductID) AS imgCount,
        (SELECT CloudinaryURL FROM ProductImage pi WHERE pi.ProductID = p.ProductID ORDER BY SortOrder LIMIT 1) AS coverImg
       FROM Product p
       WHERE p.SellerID = ? AND p.Status != 'Deleted'
       ORDER BY p.CreatedAt DESC`, [userId]);
        return res.json(rows);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}

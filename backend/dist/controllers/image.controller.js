"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImages = uploadImages;
exports.deleteImage = deleteImage;
const db_1 = require("../db");
const upload_1 = require("../middlewares/upload");
const MAX_IMAGES = 5; // tối đa 5 ảnh mỗi bài
/* ─── POST /api/products/:id/images ─────────────────────────
   Upload ảnh cho sản phẩm (multipart/form-data, field: images)
   Tối đa 5 ảnh/bài đăng.
──────────────────────────────────────────────────────────── */
async function uploadImages(req, res) {
    const userId = req.user.userId;
    const productId = parseInt(req.params.id);
    const files = req.files;
    if (!files || files.length === 0)
        return res.status(400).json({ message: 'Chưa chọn ảnh nào' });
    try {
        /* Kiểm tra quyền sở hữu */
        const [rows] = await db_1.pool.query('SELECT SellerID FROM Product WHERE ProductID = ?', [productId]);
        if (!rows[0])
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        if (rows[0].SellerID !== userId && req.user.role !== 'Admin')
            return res.status(403).json({ message: 'Không có quyền tải ảnh cho bài đăng này' });
        /* Kiểm tra số ảnh hiện tại */
        const [countRows] = await db_1.pool.query('SELECT COUNT(*) AS cnt FROM ProductImage WHERE ProductID = ?', [productId]);
        const currentCount = countRows[0].cnt;
        const canAdd = MAX_IMAGES - currentCount;
        if (canAdd <= 0)
            return res.status(400).json({ message: `Đã đủ ${MAX_IMAGES} ảnh. Xoá ảnh cũ trước khi tải thêm.` });
        const toUpload = files.slice(0, canAdd);
        const uploaded = [];
        for (let i = 0; i < toUpload.length; i++) {
            const { url, publicId } = await (0, upload_1.uploadToCloudinary)(toUpload[i].buffer, 'seafood');
            const [ins] = await db_1.pool.query('INSERT INTO ProductImage (ProductID, CloudinaryURL, PublicID, SortOrder) VALUES (?, ?, ?, ?)', [productId, url, publicId, currentCount + i]);
            uploaded.push({ id: ins.insertId, url });
        }
        return res.status(201).json({ message: `Đã tải lên ${uploaded.length} ảnh`, images: uploaded });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi khi tải ảnh lên' });
    }
}
/* ─── DELETE /api/images/:id ─── */
async function deleteImage(req, res) {
    const userId = req.user.userId;
    const imageId = parseInt(req.params.id);
    try {
        const [rows] = await db_1.pool.query(`SELECT pi.PublicID, p.SellerID
       FROM ProductImage pi
       JOIN Product p ON p.ProductID = pi.ProductID
       WHERE pi.ImageID = ?`, [imageId]);
        if (!rows[0])
            return res.status(404).json({ message: 'Không tìm thấy ảnh' });
        if (rows[0].SellerID !== userId && req.user.role !== 'Admin')
            return res.status(403).json({ message: 'Không có quyền xoá ảnh này' });
        await (0, upload_1.deleteFromCloudinary)(rows[0].PublicID);
        await db_1.pool.query('DELETE FROM ProductImage WHERE ImageID = ?', [imageId]);
        return res.json({ message: 'Đã xoá ảnh' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi khi xoá ảnh' });
    }
}

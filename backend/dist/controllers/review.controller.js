"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReview = addReview;
exports.getReviewsBySeller = getReviewsBySeller;
const db_1 = require("../db");
const upload_1 = require("../middlewares/upload");
const socket_1 = require("../socket");
async function addReview(req, res) {
    const reviewerId = req.user.userId;
    const { productId, sellerId, rating, comment } = req.body;
    if (!productId || !sellerId || !rating) {
        return res.status(400).json({ message: 'Thiếu thông tin đánh giá' });
    }
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });
    }
    try {
        let finalImageUrl = req.body.imageUrl || null;
        if (req.file) {
            const { url } = await (0, upload_1.uploadToCloudinary)(req.file.buffer, 'reviews');
            finalImageUrl = url;
        }
        const [result] = await db_1.pool.query('INSERT INTO Review (ProductID, ReviewerID, SellerID, Rating, Comment, ImageURL) VALUES (?, ?, ?, ?, ?, ?)', [Number(productId), reviewerId, Number(sellerId), numRating, comment || null, finalImageUrl]);
        // Lấy thông tin người đánh giá và sản phẩm để gửi thông báo
        try {
            const [reviewerRows] = await db_1.pool.query('SELECT Name FROM User WHERE UserID = ?', [reviewerId]);
            const reviewerName = reviewerRows[0]?.Name || 'Một người dùng';
            const [productRows] = await db_1.pool.query('SELECT Name FROM Product WHERE ProductID = ?', [Number(productId)]);
            const productName = productRows[0]?.Name || 'sản phẩm';
            const previewText = `${reviewerName} đã đánh giá ${numRating}⭐ cho "${productName}": "${comment ? comment.slice(0, 40) : 'Không có nhận xét'}"`;
            // 1. Lưu thông báo vào CSDL
            await db_1.pool.query('INSERT INTO Notification (UserID, Type, Content, ProductID) VALUES (?, ?, ?, ?)', [Number(sellerId), 'new_review', previewText, Number(productId)]);
            // 2. Phát Socket.IO thời gian thực
            const io = (0, socket_1.getIO)();
            io.to(`user_${Number(sellerId)}`).emit('notification', {
                type: 'new_review',
                productId: Number(productId),
                sellerId: Number(sellerId),
                preview: previewText,
            });
        }
        catch (socketErr) {
            console.error('Lỗi khi lưu và phát thông báo đánh giá:', socketErr);
        }
        res.status(201).json({ message: 'Đánh giá thành công', reviewId: result.insertId });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
async function getReviewsBySeller(req, res) {
    const sellerId = parseInt(req.params.sellerId);
    if (!sellerId) {
        return res.status(400).json({ message: 'Thiếu ID người bán' });
    }
    try {
        const [rows] = await db_1.pool.query(`SELECT r.ReviewID, r.Rating, r.Comment, r.ImageURL, r.CreatedAt, 
              u.Name as ReviewerName, p.Name as ProductName
       FROM Review r
       JOIN User u ON r.ReviewerID = u.UserID
       JOIN Product p ON r.ProductID = p.ProductID
       WHERE r.SellerID = ?
       ORDER BY r.CreatedAt DESC`, [sellerId]);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

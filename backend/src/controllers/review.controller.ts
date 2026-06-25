import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
import { uploadToCloudinary } from '../middlewares/upload';
<<<<<<< HEAD
import { getIO } from '../socket';

export async function addReview(req: Request, res: Response) {
  const reviewerId = (req as any).user.userId;
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

=======
import { sendServerError, parseId } from '../helpers/response.helper';
import { notifySellerNewReview } from '../services/notification.service';

export async function addReview(req: Request, res: Response) {
  const { userId: reviewerId } = req.user;
  const { productId, sellerId, rating, comment } = req.body;

  if (!productId || !sellerId || !rating)
    return res.status(400).json({ message: 'Thiếu thông tin đánh giá' });

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5)
    return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });

  if (reviewerId === Number(sellerId))
    return res.status(400).json({ message: 'Bạn không thể tự đánh giá chính mình' });

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT ReviewID FROM Review WHERE ReviewerID = ? AND ProductID = ?',
      [reviewerId, Number(productId)],
    );
    if ((existing as any[]).length > 0)
      return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });

    let finalImageUrl = req.body.imageUrl || null;
>>>>>>> origin/main
    if (req.file) {
      const { url } = await uploadToCloudinary(req.file.buffer, 'reviews');
      finalImageUrl = url;
    }

    const [result] = await pool.query(
      'INSERT INTO Review (ProductID, ReviewerID, SellerID, Rating, Comment, ImageURL) VALUES (?, ?, ?, ?, ?, ?)',
<<<<<<< HEAD
      [Number(productId), reviewerId, Number(sellerId), numRating, comment || null, finalImageUrl]
    );

    const newReviewId = (result as any).insertId;

    // Lấy thông tin người đánh giá và sản phẩm để gửi thông báo
    try {
      const [reviewerRows] = await pool.query<RowDataPacket[]>('SELECT Name FROM User WHERE UserID = ?', [reviewerId]);
      const reviewerName = reviewerRows[0]?.Name || 'Một người dùng';

      const [productRows] = await pool.query<RowDataPacket[]>('SELECT Name FROM Product WHERE ProductID = ?', [Number(productId)]);
      const productName = productRows[0]?.Name || 'sản phẩm';

      const previewText = `${reviewerName} đã đánh giá ${numRating}⭐ cho "${productName}": "${comment ? comment.slice(0, 40) : 'Không có nhận xét'}"`;

      // 1. Lưu thông báo vào CSDL (bao gồm ReviewID)
      await pool.query(
        'INSERT INTO Notification (UserID, Type, Content, ProductID, ReviewID) VALUES (?, ?, ?, ?, ?)',
        [Number(sellerId), 'new_review', previewText, Number(productId), newReviewId]
      );

      // 2. Phát Socket.IO thời gian thực
      const io = getIO();
      io.to(`user_${Number(sellerId)}`).emit('notification', {
        type: 'new_review',
        productId: Number(productId),
        sellerId: Number(sellerId),
        reviewId: newReviewId,
        preview: previewText,
      });
    } catch (socketErr) {
      console.error('Lỗi khi lưu và phát thông báo đánh giá:', socketErr);
    }

    res.status(201).json({ message: 'Đánh giá thành công', reviewId: newReviewId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
=======
      [Number(productId), reviewerId, Number(sellerId), numRating, comment || null, finalImageUrl],
    );
    const reviewId = (result as any).insertId;

    // Lấy tên người đánh giá và tên sản phẩm rồi uỷ thác cho notification service
    const [reviewerRows] = await pool.query<RowDataPacket[]>('SELECT Name FROM User WHERE UserID = ?', [reviewerId]);
    const [productRows]  = await pool.query<RowDataPacket[]>('SELECT Name FROM Product WHERE ProductID = ?', [Number(productId)]);
    await notifySellerNewReview({
      sellerId:     Number(sellerId),
      reviewerId,
      reviewerName: (reviewerRows[0] as any)?.Name || 'Một người dùng',
      productId:    Number(productId),
      productName:  (productRows[0] as any)?.Name  || 'sản phẩm',
      reviewId,
      rating: numRating,
      comment: comment || null,
    });

    return res.status(201).json({ message: 'Đánh giá thành công', reviewId });
  } catch (err) {
    return sendServerError(res, err);
>>>>>>> origin/main
  }
}

export async function getReviewsBySeller(req: Request, res: Response) {
<<<<<<< HEAD
  const sellerId = parseInt(req.params.sellerId);

  if (!sellerId) {
    return res.status(400).json({ message: 'Thiếu ID người bán' });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.ReviewID, r.Rating, r.Comment, r.ImageURL, r.CreatedAt, 
              u.Name as ReviewerName, p.Name as ProductName
       FROM Review r
       JOIN User u ON r.ReviewerID = u.UserID
       JOIN Product p ON r.ProductID = p.ProductID
       WHERE r.SellerID = ?
       ORDER BY r.CreatedAt DESC`,
      [sellerId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
=======
  const sellerId = parseId(req.params.sellerId);
  if (!sellerId) return res.status(400).json({ message: 'ID người bán không hợp lệ' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.ReviewID, r.Rating, r.Comment, r.ImageURL, r.CreatedAt,
              u.Name AS ReviewerName, p.Name AS ProductName
       FROM Review r
       JOIN User    u ON r.ReviewerID = u.UserID
       JOIN Product p ON r.ProductID  = p.ProductID
       WHERE r.SellerID = ?
       ORDER BY r.CreatedAt DESC`,
      [sellerId],
    );
    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
>>>>>>> origin/main
  }
}

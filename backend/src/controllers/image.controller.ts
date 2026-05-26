import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload';

const MAX_IMAGES = 5; // tối đa 5 ảnh mỗi bài

/* ─── POST /api/products/:id/images ─────────────────────────
   Upload ảnh cho sản phẩm (multipart/form-data, field: images)
   Tối đa 5 ảnh/bài đăng.
──────────────────────────────────────────────────────────── */
export async function uploadImages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseInt(req.params.id, 10);
  const files     = req.files as Express.Multer.File[];

  if (!files || files.length === 0)
    return res.status(400).json({ message: 'Chưa chọn ảnh nào' });

  try {
    /* Kiểm tra quyền sở hữu */
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT SellerID FROM Product WHERE ProductID = ?', [productId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (rows[0].SellerID !== userId && role !== 'Admin')
      return res.status(403).json({ message: 'Không có quyền tải ảnh cho bài đăng này' });

    /* Kiểm tra số ảnh hiện tại */
    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM ProductImage WHERE ProductID = ?', [productId],
    );
    const currentCount = countRows[0].cnt as number;
    const canAdd       = MAX_IMAGES - currentCount;

    if (canAdd <= 0)
      return res.status(400).json({ message: `Đã đủ ${MAX_IMAGES} ảnh. Xoá ảnh cũ trước khi tải thêm.` });

    const toUpload = files.slice(0, canAdd);

    // Upload to Cloudinary in parallel using Promise.all
    const uploadPromises = toUpload.map(file => uploadToCloudinary(file.buffer, 'seafood'));
    const uploadedResults = await Promise.all(uploadPromises);

    if (uploadedResults.length === 0) {
      return res.status(400).json({ message: 'Không tải lên được ảnh nào' });
    }

    // Prepare bulk INSERT values
    const values = uploadedResults.map((item, index) => [
      productId,
      item.url,
      item.publicId,
      currentCount + index,
    ]);

    const [ins] = await pool.query<ResultSetHeader>(
      'INSERT INTO ProductImage (ProductID, CloudinaryURL, PublicID, SortOrder) VALUES ?',
      [values],
    );

    const firstId = ins.insertId;
    const uploaded = uploadedResults.map((item, index) => ({
      id: firstId + index,
      url: item.url,
    }));

    return res.status(201).json({ message: `Đã tải lên ${uploaded.length} ảnh`, images: uploaded });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi khi tải ảnh lên' });
  }
}

/* ─── DELETE /api/images/:id ─── */
export async function deleteImage(req: Request, res: Response) {
  const { userId, role } = req.user;
  const imageId = parseInt(req.params.id, 10);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pi.PublicID, p.SellerID
       FROM ProductImage pi
       JOIN Product p ON p.ProductID = pi.ProductID
       WHERE pi.ImageID = ?`,
      [imageId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    if (rows[0].SellerID !== userId && role !== 'Admin')
      return res.status(403).json({ message: 'Không có quyền xoá ảnh này' });

    await deleteFromCloudinary(rows[0].PublicID);
    await pool.query('DELETE FROM ProductImage WHERE ImageID = ?', [imageId]);
    return res.json({ message: 'Đã xoá ảnh' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi khi xoá ảnh' });
  }
}

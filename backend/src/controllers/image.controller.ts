import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload';
import { sendServerError, parseId } from '../helpers/response.helper';

/**
 * Image Controller
 * Clean: dùng sendServerError + parseId nhất quán.
 */

const MAX_IMAGES = 5;

export async function uploadImages(req: Request, res: Response) {
  const { userId, role } = req.user;
  const productId = parseId(req.params.id);
  const files = req.files as Express.Multer.File[];

  if (!productId) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
  if (!files || files.length === 0)
    return res.status(400).json({ message: 'Chưa chọn ảnh nào' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT SellerID FROM Product WHERE ProductID = ?', [productId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (rows[0].SellerID !== userId && role !== 'Admin')
      return res.status(403).json({ message: 'Không có quyền tải ảnh cho bài đăng này' });

    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS cnt FROM ProductImage WHERE ProductID = ?', [productId],
    );
    const currentCount = countRows[0].cnt as number;
    const canAdd = MAX_IMAGES - currentCount;

    if (canAdd <= 0)
      return res.status(400).json({ message: `Đã đủ ${MAX_IMAGES} ảnh. Xoá ảnh cũ trước khi tải thêm.` });

    const toUpload = files.slice(0, canAdd);
    const uploadedResults = await Promise.all(
      toUpload.map((file) => uploadToCloudinary(file.buffer, 'seafood')),
    );

    const values = uploadedResults.map((item, index) => [
      productId, item.url, item.publicId, currentCount + index,
    ]);
    const [ins] = await pool.query<ResultSetHeader>(
      'INSERT INTO ProductImage (ProductID, CloudinaryURL, PublicID, SortOrder) VALUES ?',
      [values],
    );

    const uploaded = uploadedResults.map((item, index) => ({
      id: ins.insertId + index,
      url: item.url,
    }));

    return res.status(201).json({ message: `Đã tải lên ${uploaded.length} ảnh`, images: uploaded });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function deleteImage(req: Request, res: Response) {
  const { userId, role } = req.user;
  const imageId = parseId(req.params.id);

  if (!imageId) return res.status(400).json({ message: 'ID ảnh không hợp lệ' });

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
    return sendServerError(res, err);
  }
}

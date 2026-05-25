/**
 * favorite.controller.ts
 * Toggle yêu thích, lấy danh sách yêu thích
 */
import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';

// GET /api/favorites — lấy danh sách yêu thích của user hiện tại
export async function getMyFavorites(req: Request, res: Response) {
  const userId = (req as any).user.id;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT p.ProductID AS id, p.Name AS name, p.Price AS price,
             p.Type AS type, p.Status AS status,
             p.RemainingWeight AS remainingWeight,
             p.ViewCount AS viewCount,
             u.Name AS sellerName, u.IsVerified AS sellerIsVerified,
             (SELECT CloudinaryURL FROM ProductImage pi WHERE pi.ProductID = p.ProductID ORDER BY SortOrder LIMIT 1) AS coverImg,
             f.CreatedAt AS savedAt
      FROM Favorite f
      JOIN Product p ON p.ProductID = f.ProductID
      JOIN User u ON u.UserID = p.SellerID
      WHERE f.UserID = ?
      ORDER BY f.CreatedAt DESC
    `, [userId]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server' });
  }
}

// GET /api/favorites/ids — chỉ trả về mảng productId đang yêu thích
export async function getMyFavoriteIds(req: Request, res: Response) {
  const userId = (req as any).user.id;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ProductID AS productId FROM Favorite WHERE UserID = ?`, [userId]
    );
    return res.json((rows as RowDataPacket[]).map((r) => r.productId));
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server' });
  }
}

// POST /api/favorites/:productId — toggle yêu thích
export async function toggleFavorite(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const productId = parseInt(req.params.productId, 10);
  if (!productId) return res.status(400).json({ message: 'ID không hợp lệ' });

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT FavoriteID FROM Favorite WHERE UserID = ? AND ProductID = ?`,
      [userId, productId]
    );
    if ((existing as RowDataPacket[]).length > 0) {
      await pool.query(`DELETE FROM Favorite WHERE UserID = ? AND ProductID = ?`, [userId, productId]);
      return res.json({ favorited: false });
    } else {
      await pool.query(`INSERT INTO Favorite (UserID, ProductID) VALUES (?, ?)`, [userId, productId]);
      return res.json({ favorited: true });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server' });
  }
}

import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { sendServerError } from '../helpers/response.helper';

/**
 * Favorite Controller
 * Clean: dùng sendServerError nhất quán thay vì inline res.status(500).
 */

export async function getMyFavorites(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.ProductID AS id, p.Name AS name, p.Price AS price,
              p.Type AS type, p.Status AS status,
              p.RemainingWeight AS remainingWeight, p.ViewCount AS viewCount,
              u.Name AS sellerName, u.IsVerified AS sellerIsVerified,
              pi_cover.coverImg AS coverImg, f.CreatedAt AS savedAt
       FROM Favorite f
       JOIN Product p ON p.ProductID = f.ProductID
       JOIN User u ON u.UserID = p.SellerID
       LEFT JOIN (
         SELECT pi.ProductID, MAX(pi.CloudinaryURL) AS coverImg
         FROM ProductImage pi
         JOIN (
           SELECT ProductID, MIN(SortOrder) AS min_order FROM ProductImage GROUP BY ProductID
         ) pi2 ON pi.ProductID = pi2.ProductID AND pi.SortOrder = pi2.min_order
         GROUP BY pi.ProductID
       ) pi_cover ON pi_cover.ProductID = p.ProductID
       WHERE f.UserID = ?
       ORDER BY f.CreatedAt DESC`,
      [userId],
    );
    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getMyFavoriteIds(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT ProductID AS productId FROM Favorite WHERE UserID = ?',
      [userId],
    );
    return res.json(rows.map((r) => r.productId));
  } catch (err) {
    return sendServerError(res, err);
  }
}

/** Toggle yêu thích — INSERT IGNORE + DELETE pattern (race-condition safe) */
export async function toggleFavorite(req: Request, res: Response) {
  const { userId } = req.user;
  const productId = parseInt(req.params.productId, 10);
  if (!productId) return res.status(400).json({ message: 'ID không hợp lệ' });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT IGNORE INTO Favorite (UserID, ProductID) VALUES (?, ?)',
      [userId, productId],
    );

    if (result.affectedRows === 0) {
      await pool.query('DELETE FROM Favorite WHERE UserID = ? AND ProductID = ?', [userId, productId]);
      return res.json({ favorited: false });
    }
    return res.json({ favorited: true });
  } catch (err) {
    return sendServerError(res, err);
  }
}

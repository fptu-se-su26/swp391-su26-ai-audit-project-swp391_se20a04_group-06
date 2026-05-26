/**
 * favorite.controller.ts
 * Toggle yêu thích, lấy danh sách yêu thích
 *
 * BUG FIX: Tất cả 3 hàm dùng sai (req as any).user.id thay vì req.user.userId
 * Auth middleware set req.user = { userId, role } (xem middlewares/auth.ts)
 * → .user.id luôn là undefined → mọi DB query nhận NULL userId → silent bug
 */
import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db";

// GET /api/favorites — lấy danh sách yêu thích của user hiện tại
export async function getMyFavorites(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT p.ProductID AS id, p.Name AS name, p.Price AS price,
             p.Type AS type, p.Status AS status,
             p.RemainingWeight AS remainingWeight,
             p.ViewCount AS viewCount,
             u.Name AS sellerName, u.IsVerified AS sellerIsVerified,
             pi_cover.coverImg AS coverImg,
             f.CreatedAt AS savedAt
      FROM Favorite f
      JOIN Product p ON p.ProductID = f.ProductID
      JOIN User u ON u.UserID = p.SellerID
      LEFT JOIN (
        SELECT pi.ProductID, MAX(pi.CloudinaryURL) AS coverImg -- ✅ FIX: Đã bọc MAX() tương thích only_full_group_by
        FROM ProductImage pi
        JOIN (
          SELECT ProductID, MIN(SortOrder) AS min_order
          FROM ProductImage
          GROUP BY ProductID
        ) pi2 ON pi.ProductID = pi2.ProductID AND pi.SortOrder = pi2.min_order
        GROUP BY pi.ProductID
      ) pi_cover ON pi_cover.ProductID = p.ProductID
      WHERE f.UserID = ?
      ORDER BY f.CreatedAt DESC
    `,
      [userId],
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" });
  }
}

// GET /api/favorites/ids — chỉ trả về mảng productId đang yêu thích
export async function getMyFavoriteIds(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ProductID AS productId FROM Favorite WHERE UserID = ?`,
      [userId],
    );
    return res.json((rows as RowDataPacket[]).map((r) => r.productId));
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" });
  }
}

// POST /api/favorites/:productId — toggle yêu thích (race-condition safe)
export async function toggleFavorite(req: Request, res: Response) {
  const { userId } = req.user;
  const productId = parseInt(req.params.productId, 10);
  if (!productId) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    // Try to insert the favorite. If it already exists, affectedRows will be 0 due to IGNORE.
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO Favorite (UserID, ProductID) VALUES (?, ?)`,
      [userId, productId],
    );

    if (result.affectedRows === 0) {
      // It already existed, so we remove it (toggle off)
      await pool.query(
        `DELETE FROM Favorite WHERE UserID = ? AND ProductID = ?`,
        [userId, productId],
      );
      return res.json({ favorited: false });
    } else {
      // Successfully favorited (toggle on)
      return res.json({ favorited: true });
    }
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server" });
  }
}

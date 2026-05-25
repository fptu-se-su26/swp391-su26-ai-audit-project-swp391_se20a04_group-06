import "dotenv/config";
import { Request, Response } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendServerError } from "../helpers/response.helper";

/* ─── GET /api/admin/stats ─── */
export async function getStats(req: Request, res: Response) {
  try {
    const [[userRow]] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as totalUsers FROM user WHERE Role != "Admin"',
    );
    const [[verifiedRow]] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as verifiedUsers FROM user WHERE IsVerified = 1 AND Role != "Admin"',
    );
    const [[freshRow]] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as activeFresh FROM product WHERE Status = "Active" AND Type = "Fresh"',
    );
    const [[driedRow]] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as activeDried FROM product WHERE Status = "Active" AND Type = "Dried"',
    );
    const [[expiredRow]] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as expiredTotal FROM product WHERE Status = "Expired"',
    );
    const [[reviewRow]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as totalReviews, ROUND(COALESCE(AVG(Rating),0),1) as avgRating FROM review",
    );
    const [[msgRow]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as totalMessages FROM message",
    );
    const [[followRow]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as totalFollows FROM follow",
    );

    // Bài đăng 7 ngày (fill đủ 7 ngày kể cả ngày 0 bài)
    const [rawPostsPerDay] = await pool.query<RowDataPacket[]>(`
      SELECT DATE(CreatedAt) as date, COUNT(*) as count
      FROM product
      WHERE CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(CreatedAt)
      ORDER BY date ASC
    `);

    // Người dùng đăng ký 7 ngày
    const [rawUsersPerDay] = await pool.query<RowDataPacket[]>(`
      SELECT DATE(CreatedAt) as date, COUNT(*) as count
      FROM user
      WHERE CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND Role != 'Admin'
      GROUP BY DATE(CreatedAt)
      ORDER BY date ASC
    `);

    // Top 5 người bán nhiều bài nhất
    const [topSellers] = await pool.query<RowDataPacket[]>(`
      SELECT u.UserID AS id, u.Name AS name, u.IsVerified AS isVerified,
             COUNT(p.ProductID) AS postCount,
             COALESCE(AVG(r.Rating),0) AS avgRating
      FROM user u
      LEFT JOIN product p ON p.SellerID = u.UserID
      LEFT JOIN review r ON r.SellerID = u.UserID
      WHERE u.Role != 'Admin'
      GROUP BY u.UserID
      ORDER BY postCount DESC
      LIMIT 5
    `);

    // Helper: fill đủ 7 ngày với label ngắn
    function fillDays(rows: RowDataPacket[]) {
      const map: Record<string, number> = {};
      rows.forEach((r) => {
        map[r.date?.toString().slice(0, 10)] = r.count;
      });
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        result.push({
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          count: map[key] || 0,
        });
      }
      return result;
    }

    return res.json({
      totalUsers: userRow.totalUsers,
      verifiedUsers: verifiedRow.verifiedUsers,
      activeFresh: freshRow.activeFresh,
      activeDried: driedRow.activeDried,
      expiredTotal: expiredRow.expiredTotal,
      totalReviews: reviewRow.totalReviews,
      avgRating: reviewRow.avgRating,
      totalMessages: msgRow.totalMessages,
      totalFollows: followRow.totalFollows,
      postsPerDay: fillDays(rawPostsPerDay as RowDataPacket[]),
      usersPerDay: fillDays(rawUsersPerDay as RowDataPacket[]),
      topSellers,
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── GET /api/admin/users ─── */
export async function listUsers(req: Request, res: Response) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        u.UserID     AS id,
        u.Name       AS name,
        u.Phone      AS phone,
        u.Role       AS role,
        u.IsActive   AS isActive,
        u.IsVerified AS isVerified,
        COUNT(p.ProductID) AS postCount
      FROM user u
      LEFT JOIN product p ON p.SellerID = u.UserID
      GROUP BY u.UserID
      ORDER BY u.UserID DESC
    `);
    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── PATCH /api/admin/users/:id/toggle ─── */
export async function toggleUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const [[user]] = await pool.query<RowDataPacket[]>(
      "SELECT IsActive FROM user WHERE UserID = ?",
      [id],
    );
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    const newState = user.IsActive ? 0 : 1;
    await pool.query("UPDATE user SET IsActive = ? WHERE UserID = ?", [
      newState,
      id,
    ]);
    return res.json({ isActive: !!newState });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── PATCH /api/admin/users/:id/verify ─── */
export async function verifyUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const [[user]] = await pool.query<RowDataPacket[]>(
      "SELECT IsVerified FROM user WHERE UserID = ?",
      [id],
    );
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    const newState = user.IsVerified ? 0 : 1;
    await pool.query("UPDATE user SET IsVerified = ? WHERE UserID = ?", [
      newState,
      id,
    ]);
    return res.json({
      isVerified: !!newState,
      message: newState ? "Đã xác minh tài khoản" : "Đã thu hồi xác minh",
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── GET /api/admin/listings ─── */
export async function listAllProducts(req: Request, res: Response) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.ProductID       AS id,
        p.Name            AS name,
        p.Type            AS type,
        p.Status          AS status,
        p.Price           AS price,
        p.RemainingWeight AS remainingWeight,
        p.CreatedAt       AS createdAt,
        u.Name            AS sellerName,
        u.Phone           AS sellerPhone,
        (SELECT pi.CloudinaryURL
         FROM productimage pi
         WHERE pi.ProductID = p.ProductID
         ORDER BY pi.SortOrder ASC LIMIT 1) AS coverImg
      FROM product p
      JOIN user u ON u.UserID = p.SellerID
      ORDER BY p.CreatedAt DESC
    `);
    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── DELETE /api/admin/listings/:id ─── */
export async function adminDeleteProduct(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM product WHERE ProductID = ?",
      [id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    return res.json({ message: "Đã xoá bài đăng" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

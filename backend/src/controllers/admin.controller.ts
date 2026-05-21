import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../db";
import { deleteFromCloudinary } from "../middlewares/upload";

/* ─── GET /api/admin/users ─── Danh sách toàn bộ users */
export async function listUsers(req: Request, res: Response) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        u.UserID AS id, u.Name AS name, u.Phone AS phone, u.Role AS role,
        u.IsActive AS isActive, u.CreatedAt AS createdAt,
        (SELECT COUNT(*) FROM Product p WHERE p.SellerID = u.UserID AND p.Status != 'Deleted') AS postCount
       FROM User u
       ORDER BY u.CreatedAt DESC`,
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/* ─── PATCH /api/admin/users/:id/toggle ─── Khoá / Mở khoá */
export async function toggleUser(req: Request, res: Response) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT IsActive FROM User WHERE UserID = ?",
      [req.params.id],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const newStatus = rows[0].IsActive ? 0 : 1;
    await pool.query("UPDATE User SET IsActive = ? WHERE UserID = ?", [
      newStatus,
      req.params.id,
    ]);
    return res.json({
      isActive: !!newStatus,
      message: newStatus ? "Đã mở khoá tài khoản" : "Đã khoá tài khoản",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/* ─── GET /api/admin/listings ─── Tất cả bài đăng (Admin) */
export async function listAllProducts(req: Request, res: Response) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.ProductID AS id, p.Type AS type, p.Name AS name, p.Price AS price,
        p.SalesType AS salesType, p.RemainingWeight AS remainingWeight,
        p.Status AS status, p.CreatedAt AS createdAt,
        u.Name AS sellerName, u.Phone AS sellerPhone
       FROM Product p
       JOIN User u ON u.UserID = p.SellerID
       WHERE p.Status != 'Deleted'
       ORDER BY p.CreatedAt DESC`,
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/* ─── DELETE /api/admin/listings/:id ─── Admin xoá bài bất kỳ */
export async function adminDeleteProduct(req: Request, res: Response) {
  try {
    const [images] = await pool.query<RowDataPacket[]>(
      "SELECT PublicID FROM ProductImage WHERE ProductID = ?",
      [req.params.id],
    );
    await Promise.all(
      (images as any[]).map((img) => deleteFromCloudinary(img.PublicID)),
    );
    await pool.query(
      'UPDATE Product SET Status = "Deleted" WHERE ProductID = ?',
      [req.params.id],
    );
    return res.json({ message: "Đã xoá bài đăng" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

/* ─── GET /api/admin/stats ─── Thống kê tổng quan (đã nâng cấp) */
export async function getStats(req: Request, res: Response) {
  try {
    /* ── Tổng số cơ bản ── */
    const [[users]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM User",
    );
    const [[fresh]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM Product WHERE Type='Fresh' AND Status='Active'",
    );
    const [[dried]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM Product WHERE Type='Dried' AND Status='Active'",
    );
    const [[expired]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM Product WHERE Status='Expired'",
    );
    const [[messages]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM Message",
    );
    const [[reviews]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt, COALESCE(AVG(Rating),0) AS avg FROM Review",
    );
    const [[follows]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM Follow",
    );

    /* ── Bài đăng mới theo ngày – 7 ngày gần nhất ── */
    const [postsPerDay] = await pool.query<RowDataPacket[]>(`
      SELECT
        DATE(p.CreatedAt) AS day,
        COUNT(*)          AS count
      FROM Product p
      WHERE p.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND p.Status != 'Deleted'
      GROUP BY DATE(p.CreatedAt)
      ORDER BY day ASC
    `);

    /* ── Người dùng mới theo ngày – 7 ngày gần nhất ── */
    const [usersPerDay] = await pool.query<RowDataPacket[]>(`
      SELECT
        DATE(u.CreatedAt) AS day,
        COUNT(*)          AS count
      FROM User u
      WHERE u.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(u.CreatedAt)
      ORDER BY day ASC
    `);

    /* ── Top 5 người bán nhiều bài nhất ── */
    const [topSellers] = await pool.query<RowDataPacket[]>(`
      SELECT
        u.UserID                                                            AS id,
        u.Name                                                              AS name,
        COUNT(p.ProductID)                                                  AS postCount,
        COALESCE(AVG(r.Rating), 0)                                          AS avgRating,
        (SELECT COUNT(*) FROM Follow f WHERE f.SellerID = u.UserID)        AS followers
      FROM User u
      LEFT JOIN Product p ON p.SellerID = u.UserID AND p.Status != 'Deleted'
      LEFT JOIN Review  r ON r.SellerID = u.UserID
      GROUP BY u.UserID, u.Name
      ORDER BY postCount DESC
      LIMIT 5
    `);

    /* ── Điền đủ 7 ngày (kể cả ngày không có dữ liệu = 0) ── */
    const fillDays = (rows: RowDataPacket[]) => {
      const map: Record<string, number> = {};
      rows.forEach((r) => {
        map[String(r.day).slice(0, 10)] = Number(r.count);
      });
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        result.push({ day: key, label, count: map[key] ?? 0 });
      }
      return result;
    };

    return res.json({
      /* Tổng số */
      totalUsers: Number((users as any).cnt),
      activeFresh: Number((fresh as any).cnt),
      activeDried: Number((dried as any).cnt),
      expiredTotal: Number((expired as any).cnt),
      totalMessages: Number((messages as any).cnt),
      totalReviews: Number((reviews as any).cnt),
      avgRating: parseFloat(Number((reviews as any).avg).toFixed(1)),
      totalFollows: Number((follows as any).cnt),
      /* Biểu đồ 7 ngày */
      postsPerDay: fillDays(postsPerDay as RowDataPacket[]),
      usersPerDay: fillDays(usersPerDay as RowDataPacket[]),
      /* Bảng xếp hạng */
      topSellers: topSellers.map((s) => ({
        id: Number(s.id),
        name: String(s.name),
        postCount: Number(s.postCount),
        avgRating: parseFloat(Number(s.avgRating).toFixed(1)),
        followers: Number(s.followers),
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
}

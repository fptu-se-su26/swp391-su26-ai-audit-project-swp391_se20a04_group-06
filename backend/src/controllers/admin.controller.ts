import "dotenv/config";
import { Request, Response } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendServerError, parseId } from "../helpers/response.helper";

/* ─── GET /api/admin/stats ─── */
export async function getStats(req: Request, res: Response) {
  try {
    const [
      [userRows],
      [verifiedRows],
      [freshRows],
      [driedRows],
      [expiredRows],
      [reviewRows],
      [msgRows],
      [followRows],
      [rawPostsPerDay],
      [rawUsersPerDay],
      [topSellers]
    ] = await Promise.all([
      pool.query<RowDataPacket[]>('SELECT COUNT(*) as totalUsers FROM user WHERE Role != "Admin"'),
      pool.query<RowDataPacket[]>('SELECT COUNT(*) as verifiedUsers FROM user WHERE IsVerified = 1 AND Role != "Admin"'),
      pool.query<RowDataPacket[]>('SELECT COUNT(*) as activeFresh FROM product WHERE Status = "Active" AND Type = "Fresh"'),
      pool.query<RowDataPacket[]>('SELECT COUNT(*) as activeDried FROM product WHERE Status = "Active" AND Type = "Dried"'),
      pool.query<RowDataPacket[]>('SELECT COUNT(*) as expiredTotal FROM product WHERE Status = "Expired"'),
      pool.query<RowDataPacket[]>("SELECT COUNT(*) as totalReviews, ROUND(COALESCE(AVG(Rating),0),1) as avgRating FROM review"),
      pool.query<RowDataPacket[]>("SELECT COUNT(*) as totalMessages FROM message"),
      pool.query<RowDataPacket[]>("SELECT COUNT(*) as totalFollows FROM follow"),
      pool.query<RowDataPacket[]>(`
        SELECT DATE(CreatedAt) as date, COUNT(*) as count
        FROM product
        WHERE CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(CreatedAt)
        ORDER BY date ASC
      `),
      pool.query<RowDataPacket[]>(`
        SELECT DATE(CreatedAt) as date, COUNT(*) as count
        FROM user
        WHERE CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
          AND Role != 'Admin'
        GROUP BY DATE(CreatedAt)
        ORDER BY date ASC
      `),
      pool.query<RowDataPacket[]>(`
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
      `)
    ]);

    const userRow = userRows[0];
    const verifiedRow = verifiedRows[0];
    const freshRow = freshRows[0];
    const driedRow = driedRows[0];
    const expiredRow = expiredRows[0];
    const reviewRow = reviewRows[0];
    const msgRow = msgRows[0];
    const followRow = followRows[0];

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
  const page = Math.max(1, parseInt((req.query.page as string) || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt((req.query.limit as string) || "20")),
  );
  const offset = (page - 1) * limit;
  const search = (req.query.search as string | undefined)?.trim() || "";

  try {
    let whereSql = "";
    const whereParams: (string | number)[] = [];
    if (search) {
      whereSql = "WHERE (u.Name LIKE ? OR u.Phone LIKE ?)";
      whereParams.push(`%${search}%`, `%${search}%`);
    }

    const [[countRow]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM user u ${whereSql}`,
      whereParams,
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        u.UserID     AS id,
        u.Name       AS name,
        u.Phone      AS phone,
        u.Role       AS role,
        u.IsActive   AS isActive,
        u.IsVerified AS isVerified,
        COUNT(p.ProductID) AS postCount
      FROM user u
      LEFT JOIN product p ON p.SellerID = u.UserID
      ${whereSql}
      GROUP BY u.UserID
      ORDER BY u.UserID DESC
      LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    return res.json({
      data: rows,
      page,
      limit,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / limit),
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── PATCH /api/admin/users/:id/toggle ─── */
export async function toggleUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID người dùng không hợp lệ" });

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
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID người dùng không hợp lệ" });

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
  const page = Math.max(1, parseInt((req.query.page as string) || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt((req.query.limit as string) || "20")),
  );
  const offset = (page - 1) * limit;
  const search = (req.query.search as string | undefined)?.trim() || "";
  const status = (req.query.status as string | undefined) || "";

  try {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push("(p.Name LIKE ? OR u.Name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      conditions.push("p.Status = ?");
      params.push(status);
    }

    const whereSql = conditions.length
      ? "WHERE " + conditions.join(" AND ")
      : "";

    const [[countRow]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM product p
       JOIN user u ON u.UserID = p.SellerID
       ${whereSql}`,
      params,
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
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
      ${whereSql}
      ORDER BY p.CreatedAt DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.json({
      data: rows,
      page,
      limit,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / limit),
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── DELETE /api/admin/listings/:id ─── */
export async function adminDeleteProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE product SET Status = 'Deleted' WHERE ProductID = ?",
      [id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    return res.json({ message: "Đã xoá bài đăng" });
  } catch (err) {
    return sendServerError(res, err);
  }
}


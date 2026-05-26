import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db";
import { haversineKm, MAX_FRESH_DISTANCE_KM } from "../utils/haversine";
import { sendServerError, parseId } from "../helpers/response.helper";
import { notifyFollowersNewProduct } from "../services/notification.service";

/**
 * Helper function to build WHERE filters for products to avoid DRY violation.
 */
function buildProductFilters(query: Record<string, string | undefined>) {
  const { type, search, sellerId, lat, lng } = query;
  let filterSql = " WHERE p.Status = 'Active'";
  const params: any[] = [];

  if (type === "Fresh" || type === "Dried") {
    filterSql += " AND p.Type = ?";
    params.push(type);
  }
  if (search) {
    filterSql += " AND p.Name LIKE ?";
    params.push(`%${search}%`);
  }
  if (sellerId) {
    const parsedSellerId = parseInt(sellerId);
    if (!isNaN(parsedSellerId)) {
      filterSql += " AND p.SellerID = ?";
      params.push(parsedSellerId);
    }
  }

  // Pre-filter using a GPS bounding box in SQL if buyer sends coordinates for Fresh seafood
  if (type === "Fresh" && lat && lng) {
    const latVal = parseFloat(lat);
    const lngVal = parseFloat(lng);
    if (!isNaN(latVal) && !isNaN(lngVal)) {
      const latDelta = 20 / 111.0;
      const lngDelta = 20 / (111.0 * Math.cos((latVal * Math.PI) / 180.0));
      filterSql += " AND p.Lat BETWEEN ? AND ? AND p.Lng BETWEEN ? AND ?";
      params.push(
        latVal - latDelta,
        latVal + latDelta,
        lngVal - lngDelta,
        lngVal + lngDelta,
      );
    }
  }

  return { filterSql, params };
}

/**
 * Cột SELECT dùng chung cho danh sách sản phẩm.
 * Khai báo một lần để tránh lặp lại (DRY).
 */
const PRODUCT_LIST_COLUMNS = `
  p.ProductID AS id, p.SellerID AS sellerId, u.Name AS sellerName, u.Phone AS sellerPhone,
  u.IsVerified AS sellerIsVerified,
  p.Type AS type, p.Name AS name, p.Description AS description, p.Price AS price,
  p.SalesType AS salesType, p.TotalWeight AS totalWeight, p.RemainingWeight AS remainingWeight,
  p.Status AS status, p.CatchTime AS catchTime, p.Lat AS lat, p.Lng AS lng,
  p.Origin AS origin, p.ExpiryDate AS expiryDate, p.CreatedAt AS createdAt, p.ViewCount AS viewCount, p.BumpedAt AS bumpedAt,
  COALESCE(pi_agg.imgCount, 0) AS imgCount,
  COALESCE(r_agg.sellerRating, 0) AS sellerRating,
  COALESCE(r_agg.ratingCount, 0) AS ratingCount,
  pi_cover.coverImg AS coverImg
`;

const JOIN_TABLES_AGG = `
  LEFT JOIN (
    SELECT ProductID, COUNT(*) AS imgCount
    FROM ProductImage
    GROUP BY ProductID
  ) pi_agg ON pi_agg.ProductID = p.ProductID
  LEFT JOIN (
    SELECT SellerID, AVG(Rating) AS sellerRating, COUNT(*) AS ratingCount
    FROM Review
    GROUP BY SellerID
  ) r_agg ON r_agg.SellerID = p.SellerID
  LEFT JOIN (
    SELECT pi.ProductID, MAX(pi.CloudinaryURL) AS coverImg
    FROM ProductImage pi
    JOIN (
      SELECT ProductID, MIN(SortOrder) AS min_order
      FROM ProductImage
      GROUP BY ProductID
    ) pi2 ON pi.ProductID = pi2.ProductID AND pi.SortOrder = pi2.min_order
    GROUP BY pi.ProductID
  ) pi_cover ON pi_cover.ProductID = p.ProductID
`;

/* ─── GET /api/products ──────────────────────────────────────
   Query params:
     type       = Fresh | Dried
     lat, lng   = vị trí buyer (để lọc hải sản tươi theo 20km)
     search     = tìm theo tên
     page       = trang (mặc định 1)
     limit      = số bản ghi / trang (mặc định 20)
──────────────────────────────────────────────────────────── */
export async function getProducts(req: Request, res: Response) {
  try {
    const {
      type,
      lat,
      lng,
      search,
      sellerId,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || "1"));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || "20")));

    const { filterSql, params: filterParams } = buildProductFilters(
      req.query as Record<string, string | undefined>,
    );

    let products: RowDataPacket[] = [];
    let total = 0;

    if (type === "Fresh" && lat && lng) {
      // Fetch all candidate products within the bounding box
      const sql = `
        SELECT ${PRODUCT_LIST_COLUMNS}
        FROM Product p
        JOIN User u ON u.UserID = p.SellerID
        ${JOIN_TABLES_AGG}
        ${filterSql}
        ORDER BY p.BumpedAt DESC, p.CreatedAt DESC
      `;
      const [rows] = await pool.query<RowDataPacket[]>(sql, filterParams);

      const bLat = parseFloat(lat);
      const bLng = parseFloat(lng);

      const filtered = (rows as RowDataPacket[]).filter((p) => {
        if (!p.lat || !p.lng) return false;
        return (
          haversineKm(bLat, bLng, parseFloat(p.lat), parseFloat(p.lng)) <=
          MAX_FRESH_DISTANCE_KM
        );
      });

      total = filtered.length;
      const start = (pageNum - 1) * limitNum;
      products = filtered.slice(start, start + limitNum);
    } else {
      // Standard query with SQL pagination
      const countSql = `
        SELECT COUNT(*) AS total
        FROM Product p
        ${filterSql}
      `;
      const [[countRow]] = await pool.query<RowDataPacket[]>(
        countSql,
        filterParams,
      );
      total = countRow.total;

      const sql = `
        SELECT ${PRODUCT_LIST_COLUMNS}
        FROM Product p
        JOIN User u ON u.UserID = p.SellerID
        ${JOIN_TABLES_AGG}
        ${filterSql}
        ORDER BY p.BumpedAt DESC, p.CreatedAt DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.query<RowDataPacket[]>(sql, [
        ...filterParams,
        limitNum,
        (pageNum - 1) * limitNum,
      ]);
      products = rows;
    }

    return res.json({
      data: products,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── GET /api/products/:id ─── */
export async function getProductById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM Product p
       JOIN User u ON u.UserID = p.SellerID
       ${JOIN_TABLES_AGG}
       WHERE p.ProductID = ?`,
      [id],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    await pool
      .query(
        `UPDATE Product SET ViewCount = ViewCount + 1 WHERE ProductID = ?`,
        [id],
      )
      .catch(() => {});
    const [images] = await pool.query<RowDataPacket[]>(
      "SELECT ImageID AS id, CloudinaryURL AS url, SortOrder FROM ProductImage WHERE ProductID = ? ORDER BY SortOrder",
      [id],
    );
    return res.json({ ...rows[0], images });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── POST /api/products ─── (yêu cầu đăng nhập) */
export async function createProduct(req: Request, res: Response) {
  const { userId } = req.user;
  const {
    type,
    name,
    description,
    price,
    salesType,
    totalWeight,
    catchTime,
    lat,
    lng,
    origin,
    expiryDate,
  } = req.body;

  if (!type || !name || !price || !totalWeight)
    return res.status(400).json({
      message: "Thiếu thông tin bắt buộc: loại, tên, giá, khối lượng",
    });

  if (type === "Fresh" && (!lat || !lng))
    return res
      .status(400)
      .json({ message: "Hải sản tươi bắt buộc phải có toạ độ GPS" });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Product
        (SellerID, Type, Name, Description, Price, SalesType, TotalWeight, RemainingWeight, CatchTime, Lat, Lng, Origin, ExpiryDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        type,
        name.trim(),
        description ?? null,
        parseInt(price),
        salesType ?? "Retail",
        parseFloat(totalWeight),
        parseFloat(totalWeight), // RemainingWeight = TotalWeight lúc mới đăng
        catchTime ?? null,
        lat ?? null,
        lng ?? null,
        origin ?? null,
        expiryDate ?? null,
      ],
    );
    const productId = result.insertId;

    // Lấy tên người bán rồi phát thông báo (delegated to service)
    const [userRows] = await pool.query<RowDataPacket[]>(
      "SELECT Name FROM User WHERE UserID = ?",
      [userId],
    );
    const sellerName = (userRows[0] as any)?.Name || "Một ngư dân";
    await notifyFollowersNewProduct(userId, sellerName, productId, name);

    return res.status(201).json({ message: "Đăng bài thành công", productId });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── PUT /api/products/:id ─── (chủ bài hoặc admin) */
export async function updateProduct(req: Request, res: Response) {
  const { userId, role } = req.user;
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT SellerID FROM Product WHERE ProductID = ?",
      [id],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    if (role !== "Admin" && (rows[0] as any).SellerID !== userId)
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chỉnh sửa bài đăng này" });

    const {
      name,
      description,
      price,
      salesType,
      remainingWeight,
      status,
      origin,
      expiryDate,
    } = req.body;
    await pool.query(
      `UPDATE Product SET
        Name            = COALESCE(?, Name),
        Description     = COALESCE(?, Description),
        Price           = COALESCE(?, Price),
        SalesType       = COALESCE(?, SalesType),
        RemainingWeight = COALESCE(?, RemainingWeight),
        Status          = COALESCE(?, Status),
        Origin          = COALESCE(?, Origin),
        ExpiryDate      = COALESCE(?, ExpiryDate)
       WHERE ProductID = ?`,
      [
        name,
        description,
        price,
        salesType,
        remainingWeight,
        status,
        origin,
        expiryDate,
        id,
      ],
    );
    return res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── DELETE /api/products/:id ─── (chủ bài hoặc admin) */
export async function deleteProduct(req: Request, res: Response) {
  const { userId, role } = req.user;
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT SellerID FROM Product WHERE ProductID = ?",
      [id],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    if (role !== "Admin" && (rows[0] as any).SellerID !== userId)
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xoá bài đăng này" });

    await pool.query(
      'UPDATE Product SET Status = "Deleted" WHERE ProductID = ?',
      [id],
    );
    return res.json({ message: "Đã xoá bài đăng" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── GET /api/products/my ─── Bài đăng của chính người dùng (Dashboard) */
export async function getMyProducts(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.ProductID AS id, p.Type AS type, p.Name AS name, p.Price AS price,
        p.SalesType AS salesType, p.TotalWeight AS totalWeight, p.RemainingWeight AS remainingWeight,
        p.Status AS status, p.CatchTime AS catchTime, p.Origin AS origin, p.ExpiryDate AS expiryDate,
        p.CreatedAt AS createdAt, p.ViewCount AS viewCount, p.BumpedAt AS bumpedAt,
        COALESCE(pi_agg.imgCount, 0) AS imgCount,
        pi_cover.coverImg AS coverImg
       FROM Product p
       LEFT JOIN (
         SELECT ProductID, COUNT(*) AS imgCount
         FROM ProductImage
         GROUP BY ProductID
       ) pi_agg ON pi_agg.ProductID = p.ProductID
       LEFT JOIN (
         SELECT pi.ProductID, MAX(pi.CloudinaryURL) AS coverImg
         FROM ProductImage pi
         JOIN (
           SELECT ProductID, MIN(SortOrder) AS min_order
           FROM ProductImage
           GROUP BY ProductID
         ) pi2 ON pi.ProductID = pi2.ProductID AND pi.SortOrder = pi2.min_order
         GROUP BY pi.ProductID
       ) pi_cover ON pi_cover.ProductID = p.ProductID
       WHERE p.SellerID = ? AND p.Status != 'Deleted'
       ORDER BY p.CreatedAt DESC`,
      [userId],
    );
    return res.json(rows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

/* ─── POST /api/products/:id/bump ─── (1 lần/24h miễn phí) */
export async function bumpProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });
  const { userId } = req.user; // ✅ FIX: was (req as any).user.id which returns undefined
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT SellerID, BumpedAt FROM Product WHERE ProductID = ? AND Status = 'Active'`,
      [id],
    );
    const product = (rows as RowDataPacket[])[0];
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    if (product.SellerID !== userId)
      return res.status(403).json({ message: "Không có quyền" });

    // Kiểm tra 24h cooldown
    if (product.BumpedAt) {
      const diffMs = Date.now() - new Date(product.BumpedAt).getTime();
      if (diffMs < 24 * 3600 * 1000) {
        const remaining = Math.ceil((24 * 3600 * 1000 - diffMs) / 3600000);
        return res
          .status(429)
          .json({ message: `Đẩy tin lại sau ${remaining} giờ nữa` });
      }
    }
    // Bump = cập nhật BumpedAt (dùng làm sort key)
    await pool.query(
      `UPDATE Product SET BumpedAt = NOW() WHERE ProductID = ?`,
      [id],
    );
    return res.json({ message: "Đã đẩy tin thành công!" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

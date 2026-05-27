import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';

/**
 * Product Repository — tập trung toàn bộ SQL liên quan đến bảng Product.
 * Pattern: Repository Pattern
 *
 * BEFORE: SQL product rải rác trong product.controller.ts (>250 dòng).
 *   PRODUCT_LIST_COLUMNS và JOIN_TABLES_AGG được khai báo trong controller.
 *   getMyProducts() tự viết lại subquery tương tự JOIN_TABLES_AGG → vi phạm DRY.
 * AFTER: tất cả SQL tập trung tại đây, constants được reuse nhất quán.
 */

/* ─── Shared SQL Fragments ─────────────────────────────────── */

export const PRODUCT_LIST_COLUMNS = `
  p.ProductID AS id, p.SellerID AS sellerId, u.Name AS sellerName, u.Phone AS sellerPhone,
  u.IsVerified AS sellerIsVerified,
  p.Type AS type, p.Name AS name, p.Description AS description, p.Price AS price,
  p.SalesType AS salesType, p.TotalWeight AS totalWeight, p.RemainingWeight AS remainingWeight,
  p.Status AS status, p.CatchTime AS catchTime, p.Lat AS lat, p.Lng AS lng,
  p.Origin AS origin, p.ExpiryDate AS expiryDate, p.CreatedAt AS createdAt,
  p.ViewCount AS viewCount, p.BumpedAt AS bumpedAt,
  COALESCE(pi_agg.imgCount, 0) AS imgCount,
  COALESCE(r_agg.sellerRating, 0) AS sellerRating,
  COALESCE(r_agg.ratingCount, 0) AS ratingCount,
  pi_cover.coverImg AS coverImg
`;

export const JOIN_TABLES_AGG = `
  LEFT JOIN (
    SELECT ProductID, COUNT(*) AS imgCount
    FROM ProductImage GROUP BY ProductID
  ) pi_agg ON pi_agg.ProductID = p.ProductID
  LEFT JOIN (
    SELECT SellerID, AVG(Rating) AS sellerRating, COUNT(*) AS ratingCount
    FROM Review GROUP BY SellerID
  ) r_agg ON r_agg.SellerID = p.SellerID
  LEFT JOIN (
    SELECT pi.ProductID, MAX(pi.CloudinaryURL) AS coverImg
    FROM ProductImage pi
    JOIN (
      SELECT ProductID, MIN(SortOrder) AS min_order
      FROM ProductImage GROUP BY ProductID
    ) pi2 ON pi.ProductID = pi2.ProductID AND pi.SortOrder = pi2.min_order
    GROUP BY pi.ProductID
  ) pi_cover ON pi_cover.ProductID = p.ProductID
`;

/* ─── Filter Builder ─────────────────────────────────────────── */

export interface ProductFilterOptions {
  type?: string;
  search?: string;
  sellerId?: string;
  lat?: string;
  lng?: string;
}

export function buildProductFilters(query: ProductFilterOptions) {
  const { type, search, sellerId, lat, lng } = query;
  let filterSql = " WHERE p.Status = 'Active'";
  const params: any[] = [];

  if (type === 'Fresh' || type === 'Dried') {
    filterSql += ' AND p.Type = ?'; params.push(type);
  }
  if (search) {
    filterSql += ' AND p.Name LIKE ?'; params.push(`%${search}%`);
  }
  if (sellerId) {
    const parsed = parseInt(sellerId, 10);
    if (!isNaN(parsed)) { filterSql += ' AND p.SellerID = ?'; params.push(parsed); }
  }
  if (type === 'Fresh' && lat && lng) {
    const latVal = parseFloat(lat);
    const lngVal = parseFloat(lng);
    if (!isNaN(latVal) && !isNaN(lngVal)) {
      const latDelta = 20 / 111.0;
      const lngDelta = 20 / (111.0 * Math.cos((latVal * Math.PI) / 180.0));
      filterSql += ' AND p.Lat BETWEEN ? AND ? AND p.Lng BETWEEN ? AND ?';
      params.push(latVal - latDelta, latVal + latDelta, lngVal - lngDelta, lngVal + lngDelta);
    }
  }
  return { filterSql, params };
}

/* ─── Repository Methods ─────────────────────────────────────── */

export interface CreateProductData {
  sellerId: number;
  type: string;
  name: string;
  description?: string;
  price: number;
  salesType: string;
  totalWeight: number;
  catchTime?: string;
  lat?: number;
  lng?: number;
  origin?: string;
  expiryDate?: string;
}

export const productRepository = {
  /** Lấy chi tiết một sản phẩm kèm aggregation */
  async findById(id: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM Product p
       JOIN User u ON u.UserID = p.SellerID
       ${JOIN_TABLES_AGG}
       WHERE p.ProductID = ?`,
      [id],
    );
    return rows[0] ?? null;
  },

  /** Lấy danh sách ảnh của sản phẩm */
  async findImages(productId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT ImageID AS id, CloudinaryURL AS url, SortOrder FROM ProductImage WHERE ProductID = ? ORDER BY SortOrder',
      [productId],
    );
    return rows;
  },

  /** Tăng view count bất đồng bộ (fire-and-forget) */
  async incrementViewCount(id: number): Promise<void> {
    await pool.query('UPDATE Product SET ViewCount = ViewCount + 1 WHERE ProductID = ?', [id]);
  },

  /** Kiểm tra quyền sở hữu trước khi update/delete */
  async findOwner(id: number): Promise<{ SellerID: number } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT SellerID FROM Product WHERE ProductID = ?', [id],
    );
    return (rows[0] as any) ?? null;
  },

  /** Lấy thông tin cần thiết để kiểm tra cooldown bump */
  async findForBump(id: number): Promise<{ SellerID: number; BumpedAt: Date | null } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT SellerID, BumpedAt FROM Product WHERE ProductID = ? AND Status = 'Active'", [id],
    );
    return (rows[0] as any) ?? null;
  },

  /** Tạo sản phẩm mới — trả về insertId */
  async create(data: CreateProductData): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Product
        (SellerID, Type, Name, Description, Price, SalesType, TotalWeight, RemainingWeight,
         CatchTime, Lat, Lng, Origin, ExpiryDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.sellerId, data.type, data.name, data.description ?? null,
        data.price, data.salesType, data.totalWeight,
        data.totalWeight, // RemainingWeight = TotalWeight lúc mới đăng
        data.catchTime ?? null, data.lat ?? null, data.lng ?? null,
        data.origin ?? null, data.expiryDate ?? null,
      ],
    );
    return result.insertId;
  },

  /** Cập nhật sản phẩm — dùng COALESCE để chỉ update field được truyền */
  async update(id: number, fields: Record<string, any>): Promise<void> {
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
        fields.name, fields.description, fields.price, fields.salesType,
        fields.remainingWeight, fields.status, fields.origin, fields.expiryDate, id,
      ],
    );
  },

  /** Soft-delete: đổi status thành 'Deleted' thay vì xoá thật */
  async softDelete(id: number): Promise<void> {
    await pool.query('UPDATE Product SET Status = "Deleted" WHERE ProductID = ?', [id]);
  },

  /** Cập nhật BumpedAt để đẩy tin lên đầu */
  async bump(id: number): Promise<void> {
    await pool.query('UPDATE Product SET BumpedAt = NOW() WHERE ProductID = ?', [id]);
  },

  /**
   * Lấy danh sách bài đăng của người bán (dashboard).
   * BEFORE: getMyProducts() trong controller tự viết lại subquery image — vi phạm DRY.
   * AFTER: tái sử dụng cùng JOIN pattern nhất quán.
   */
  async findByOwner(sellerId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.ProductID AS id, p.Type AS type, p.Name AS name, p.Price AS price,
        p.SalesType AS salesType, p.TotalWeight AS totalWeight,
        p.RemainingWeight AS remainingWeight, p.Status AS status,
        p.CatchTime AS catchTime, p.Origin AS origin, p.ExpiryDate AS expiryDate,
        p.CreatedAt AS createdAt, p.ViewCount AS viewCount, p.BumpedAt AS bumpedAt,
        COALESCE(pi_agg.imgCount, 0) AS imgCount,
        pi_cover.coverImg AS coverImg
       FROM Product p
       LEFT JOIN (
         SELECT ProductID, COUNT(*) AS imgCount FROM ProductImage GROUP BY ProductID
       ) pi_agg ON pi_agg.ProductID = p.ProductID
       LEFT JOIN (
         SELECT pi.ProductID, MAX(pi.CloudinaryURL) AS coverImg
         FROM ProductImage pi
         JOIN (
           SELECT ProductID, MIN(SortOrder) AS min_order FROM ProductImage GROUP BY ProductID
         ) pi2 ON pi.ProductID = pi2.ProductID AND pi.SortOrder = pi2.min_order
         GROUP BY pi.ProductID
       ) pi_cover ON pi_cover.ProductID = p.ProductID
       WHERE p.SellerID = ? AND p.Status != 'Deleted'
       ORDER BY p.CreatedAt DESC`,
      [sellerId],
    );
    return rows;
  },
};

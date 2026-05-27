import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import {
  productRepository,
  buildProductFilters,
  PRODUCT_LIST_COLUMNS,
  JOIN_TABLES_AGG,
} from '../repositories/product.repository';
import { userRepository } from '../repositories/user.repository';
import { haversineKm, MAX_FRESH_DISTANCE_KM } from '../utils/haversine';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { notifyFollowersNewProduct } from './notification.service';

/**
 * Product Service — business logic cho toàn bộ domain sản phẩm.
 * Pattern: Service Layer
 *
 * BEFORE: product.controller.ts (~300 dòng) chứa lẫn lộn:
 *   - HTTP parsing, validation
 *   - Business rules (kiểm tra quyền, bump cooldown, distance filter)
 *   - SQL queries trực tiếp
 * AFTER: Controller chỉ parse HTTP và gọi service.
 *   Service chứa business logic, gọi repository cho DB.
 */

class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export const productService = {
  /** Lấy danh sách sản phẩm có filter + phân trang */
  async list(query: Record<string, string | undefined>) {
    const { type, lat, lng, page: rawPage, limit: rawLimit } = query;
    const { page, limit, offset } = parsePagination(rawPage, rawLimit);
    const { filterSql, params: filterParams } = buildProductFilters(query);

    // Lọc hải sản tươi theo vị trí GPS (Haversine) — phải fetch trước rồi filter ở app
    if (type === 'Fresh' && lat && lng) {
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

      const filtered = rows.filter(
        (p) =>
          p.lat &&
          p.lng &&
          haversineKm(bLat, bLng, parseFloat(p.lat), parseFloat(p.lng)) <=
            MAX_FRESH_DISTANCE_KM,
      );

      const start = (page - 1) * limit;
      return paginatedResponse(filtered.slice(start, start + limit), filtered.length, page, limit);
    }

    // Sản phẩm khô hoặc không có toạ độ — dùng SQL pagination chuẩn
    const [[countRow]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM Product p ${filterSql}`,
      filterParams,
    );
    const sql = `
      SELECT ${PRODUCT_LIST_COLUMNS}
      FROM Product p
      JOIN User u ON u.UserID = p.SellerID
      ${JOIN_TABLES_AGG}
      ${filterSql}
      ORDER BY p.BumpedAt DESC, p.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [...filterParams, limit, offset]);
    return paginatedResponse(rows, countRow.total, page, limit);
  },

  /** Lấy chi tiết sản phẩm kèm ảnh, tự tăng ViewCount */
  async getById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm');

    // Fire-and-forget: không block response nếu update thất bại
    productRepository.incrementViewCount(id).catch(() => {});

    const images = await productRepository.findImages(id);
    return { ...product, images };
  },

  /** Tạo sản phẩm mới và gửi notification cho followers */
  async create(userId: number, body: Record<string, any>): Promise<{ productId: number }> {
    const { type, name, description, price, salesType, totalWeight, catchTime, lat, lng, origin, expiryDate } = body;

    if (!type || !name || !price || !totalWeight)
      throw new HttpError(400, 'Thiếu thông tin bắt buộc: loại, tên, giá, khối lượng');
    if (type === 'Fresh' && (!lat || !lng))
      throw new HttpError(400, 'Hải sản tươi bắt buộc phải có toạ độ GPS');

    const productId = await productRepository.create({
      sellerId: userId,
      type,
      name: name.trim(),
      description,
      price: parseInt(price, 10),
      salesType: salesType ?? 'Retail',
      totalWeight: parseFloat(totalWeight),
      catchTime,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      origin,
      expiryDate,
    });

    // Lấy tên người bán rồi gửi notification (delegate sang service)
    const sellerName = (await userRepository.getNameById(userId)) ?? 'Một ngư dân';
    await notifyFollowersNewProduct(userId, sellerName, productId, name);

    return { productId };
  },

  /** Cập nhật sản phẩm — kiểm tra quyền sở hữu trước */
  async update(id: number, userId: number, role: string, body: Record<string, any>): Promise<void> {
    const owner = await productRepository.findOwner(id);
    if (!owner) throw new HttpError(404, 'Không tìm thấy sản phẩm');
    if (role !== 'Admin' && owner.SellerID !== userId)
      throw new HttpError(403, 'Bạn không có quyền chỉnh sửa bài đăng này');

    await productRepository.update(id, body);
  },

  /** Xoá mềm sản phẩm — kiểm tra quyền sở hữu trước */
  async delete(id: number, userId: number, role: string): Promise<void> {
    const owner = await productRepository.findOwner(id);
    if (!owner) throw new HttpError(404, 'Không tìm thấy sản phẩm');
    if (role !== 'Admin' && owner.SellerID !== userId)
      throw new HttpError(403, 'Bạn không có quyền xoá bài đăng này');

    await productRepository.softDelete(id);
  },

  /** Đẩy tin — kiểm tra cooldown 24h */
  async bump(id: number, userId: number): Promise<void> {
    const product = await productRepository.findForBump(id);
    if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm');
    if (product.SellerID !== userId) throw new HttpError(403, 'Không có quyền');

    if (product.BumpedAt) {
      const diffMs = Date.now() - new Date(product.BumpedAt).getTime();
      if (diffMs < 24 * 3600 * 1000) {
        const remaining = Math.ceil((24 * 3600 * 1000 - diffMs) / 3600000);
        throw new HttpError(429, `Đẩy tin lại sau ${remaining} giờ nữa`);
      }
    }

    await productRepository.bump(id);
  },
};

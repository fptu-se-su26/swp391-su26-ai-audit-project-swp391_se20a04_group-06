import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { productRepository } from "../repositories/product.repository";
import { Product } from "../models/Product";
import { sendServerError, parseId } from "../helpers/response.helper";
import { parsePagination, paginatedResponse } from "../utils/pagination";


export async function getProducts(req: Request, res: Response) {
  try {
    const result = await productService.list(
      req.query as Record<string, string | undefined>,
    );
    return res.json(result);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getProductById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    const product = await productService.getById(id);
    return res.json(product);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

// 🌟 API Lấy lịch sử biến động giá của mẻ hải sản
// Trong tệp: backend/src/controllers/product.controller.ts

export async function getProductPriceHistory(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    // 🌟 GIẢI PHÁP: Sử dụng findOne và loại trừ các sản phẩm đã xóa mềm (Deleted)
    const product = await Product.findOne({
      _id: id,
      status: { $ne: "Deleted" }
    }).select("priceHistory");

    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Sắp xếp giảm dần theo changedAt
    const history = (product.priceHistory || []).sort(
      (a: any, b: any) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    );

    return res.json(
      history.map((h: any) => ({
        oldPrice: h.oldPrice,
        newPrice: h.newPrice,
        changedAt: h.changedAt
      }))
    );
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const result = await productService.create(req.user.userId, req.body);
    return res.status(201).json({ message: "Đăng bài thành công", ...result });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function updateProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    await productService.update(id, req.user.userId, req.user.role, req.body);
    return res.json({ message: "Cập nhật thành công" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function deleteProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    await productService.delete(id, req.user.userId, req.user.role);
    return res.json({ message: "Đã xoá bài đăng" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

import { User } from "../models/User";

export async function getMyProducts(req: Request, res: Response) {
  // Bóc tách an toàn chuỗi truy vấn bằng phương pháp ép kiểu chặt chẽ đã sửa ở bước trước
  const rawPage = typeof req.query.page === "string" ? req.query.page : undefined;
  const rawLimit = typeof req.query.limit === "string" ? req.query.limit : undefined;

  // Phân trang với giới hạn tối đa 50 bài viết mỗi trang
  const { page, limit, offset } = parsePagination(rawPage, rawLimit, 50);

  try {
    const { data, total } = await productRepository.findByOwner(req.user.userId, offset, limit);

    // Trả về định dạng phân trang chuẩn của hệ thống: { data, page, limit, total, totalPages }
    return res.json(paginatedResponse(data, total, page, limit));
  } catch (err) {
    return sendServerError(res, err);
  }
}

// Trong tệp: backend/src/controllers/product.controller.ts

export async function getTodayCount(req: Request, res: Response) {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // 🌟 GIẢI PHÁP ĐỒNG BỘ: Tính toán mốc ngày mới 00:00 giờ đêm theo múi giờ Việt Nam (UTC+7)
    const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    nowVN.setUTCHours(0, 0, 0, 0);
    const startOfDay = new Date(nowVN.getTime() - 7 * 60 * 60 * 1000);

    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const count = await Product.countDocuments({
      sellerId: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "Deleted" },
    });

    return res.json({
      count,
      max: 5,
      isPremium: !!user.isPremium,
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function bumpProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });
  try {
    await productService.bump(id, req.user.userId);
    return res.json({ message: "Đã đẩy tin thành công!" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

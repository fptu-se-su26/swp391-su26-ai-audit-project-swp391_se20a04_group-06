import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { productRepository } from "../repositories/product.repository";
import { Product } from "../models/Product";
import { sendServerError, parseId } from "../helpers/response.helper";

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
export async function getProductPriceHistory(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    const product = await Product.findById(id).select("priceHistory");
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
  try {
    const products = await productRepository.findByOwner(req.user.userId);
    return res.json(products);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getTodayCount(req: Request, res: Response) {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

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

import { Request, Response } from "express";
import { productService } from "../services/product.service";
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
  if (!id) return res.status(400).json({ message: "ID mẻ hàng không hợp lệ" });
  try {
    const product = await productService.getById(id);
    return res.json(product);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getProductPriceHistory(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    const history = await productService.getPriceHistory(id);
    return res.json(
      history.map((h: any) => ({
        oldPrice: h.oldPrice,
        newPrice: h.newPrice,
        changedAt: h.changedAt,
      })),
    );
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
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

export async function getMyProducts(req: Request, res: Response) {
  const rawPage =
    typeof req.query.page === "string" ? req.query.page : undefined;
  const rawLimit =
    typeof req.query.limit === "string" ? req.query.limit : undefined;

  try {
    const { products, total, page, limit } = await productService.getProducts(
      req.user.userId,
      rawPage,
      rawLimit,
    );
    return res.json(paginatedResponse(products, total, page, limit));
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getTodayCount(req: Request, res: Response) {
  try {
    const userId = req.user.userId;
    const stats = await productService.getTodayCount(userId);
    return res.json(stats);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
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

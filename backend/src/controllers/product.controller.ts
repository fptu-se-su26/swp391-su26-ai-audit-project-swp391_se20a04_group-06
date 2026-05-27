import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { productRepository } from '../repositories/product.repository';
import { sendServerError, parseId } from '../helpers/response.helper';

/**
 * Product Controller — chỉ xử lý HTTP layer.
 * Pattern: Thin Controller
 *
 * BEFORE: ~300 dòng chứa SQL, business logic, filter building, haversine, pagination.
 * AFTER:  ~70 dòng — parse req → gọi service → trả res.
 */

export async function getProducts(req: Request, res: Response) {
  try {
    const result = await productService.list(req.query as Record<string, string | undefined>);
    return res.json(result);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getProductById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
  try {
    const product = await productService.getById(id);
    return res.json(product);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const result = await productService.create(req.user.userId, req.body);
    return res.status(201).json({ message: 'Đăng bài thành công', ...result });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function updateProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
  try {
    await productService.update(id, req.user.userId, req.user.role, req.body);
    return res.json({ message: 'Cập nhật thành công' });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function deleteProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
  try {
    await productService.delete(id, req.user.userId, req.user.role);
    return res.json({ message: 'Đã xoá bài đăng' });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getMyProducts(req: Request, res: Response) {
  try {
    const products = await productRepository.findByOwner(req.user.userId);
    return res.json(products);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function bumpProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    await productService.bump(id, req.user.userId);
    return res.json({ message: 'Đã đẩy tin thành công!' });
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

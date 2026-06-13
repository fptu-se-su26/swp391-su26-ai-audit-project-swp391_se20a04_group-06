import { Request, Response, NextFunction } from "express";
import { parseId } from "../../../../helpers/response.helper";
import { paginatedResponse } from "../../../../utils/pagination";
import { productService } from "../../../../services/product.service";

// DDD Components
import { MongooseProductRepository } from "../../infrastructure/persistence/mongoose/MongooseProductRepository";
import { CreateProductUseCase } from "../../application/use-cases/CreateProductUseCase";
import { UpdateProductUseCase } from "../../application/use-cases/UpdateProductUseCase";
import { DeleteProductUseCase } from "../../application/use-cases/DeleteProductUseCase";
import { BumpProductUseCase } from "../../application/use-cases/BumpProductUseCase";

const productRepository = new MongooseProductRepository();
const createProductUseCase = new CreateProductUseCase(productRepository);
const updateProductUseCase = new UpdateProductUseCase(productRepository);
const deleteProductUseCase = new DeleteProductUseCase(productRepository);
const bumpProductUseCase = new BumpProductUseCase(productRepository);

// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.list(req.query as Record<string, string | undefined>);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID mẻ hàng không hợp lệ" });
  try {
    const product = await productService.getById(id);
    return res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function getMyProducts(req: Request, res: Response, next: NextFunction) {
  const rawPage = typeof req.query.page === "string" ? req.query.page : undefined;
  const rawLimit = typeof req.query.limit === "string" ? req.query.limit : undefined;

  try {
    const { products, total, page, limit } = await productService.getProducts(
      req.user.userId,
      rawPage,
      rawLimit
    );
    return res.json(paginatedResponse(products, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getTodayCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user.userId;
    const stats = await productService.getTodayCount(userId);
    return res.json(stats);
  } catch (err) {
    next(err);
  }
}

// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await createProductUseCase.execute(req.user.userId, req.body);
    return res.status(201).json({ message: "Đăng bài thành công", ...result });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    await updateProductUseCase.execute(id, req.user.userId, req.user.role, req.body);
    return res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    await deleteProductUseCase.execute(id, req.user.userId, req.user.role);
    return res.json({ message: "Đã xoá bài đăng" });
  } catch (err) {
    next(err);
  }
}

export async function bumpProduct(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });
  try {
    await bumpProductUseCase.execute(id, req.user.userId);
    return res.json({ message: "Đã đẩy tin thành công!" });
  } catch (err) {
    next(err);
  }
}

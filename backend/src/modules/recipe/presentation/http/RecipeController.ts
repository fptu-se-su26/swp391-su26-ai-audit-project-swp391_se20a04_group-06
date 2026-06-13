import { Request, Response, NextFunction } from "express";
import { parseId } from "../../../../helpers/response.helper";
import { recipeService } from "../../../../services/recipe.service";

// DDD Components
import { MongooseRecipeRepository } from "../../infrastructure/persistence/mongoose/MongooseRecipeRepository";
import { CreateRecipeUseCase } from "../../application/use-cases/CreateRecipeUseCase";
import { UpdateRecipeUseCase } from "../../application/use-cases/UpdateRecipeUseCase";
import { DeleteRecipeUseCase } from "../../application/use-cases/DeleteRecipeUseCase";
import { ToggleLikeRecipeUseCase } from "../../application/use-cases/ToggleLikeRecipeUseCase";

const recipeRepository = new MongooseRecipeRepository();
const createRecipeUseCase = new CreateRecipeUseCase(recipeRepository);
const updateRecipeUseCase = new UpdateRecipeUseCase(recipeRepository);
const deleteRecipeUseCase = new DeleteRecipeUseCase(recipeRepository);
const toggleLikeRecipeUseCase = new ToggleLikeRecipeUseCase(recipeRepository);

// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────
// Các API đọc được tối ưu hóa hiệu năng bằng cách truy vấn trực tiếp thông qua
// tầng Service / Repository cũ (Mongoose populate thô), bỏ qua Mapping phức tạp.

/**
 * Lấy danh sách các công thức món ăn (hỗ trợ phân trang, tìm kiếm, độ khó, thẻ tag).
 */
export async function getRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await recipeService.list(req.query as any);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Lấy chi tiết một công thức món ăn theo ID (đồng thời tăng số lượt xem).
 */
export async function getRecipeById(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    const recipe = await recipeService.getById(id);
    return res.json(recipe);
  } catch (err) {
    next(err);
  }
}

// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────
// Các API ghi bắt buộc phải đi qua các DDD Use Cases và Domain Entities để 
// thực thi toàn bộ các quy tắc kiểm tra và đảm bảo tính toàn vẹn dữ liệu.

/**
 * Tạo mới một công thức nấu ăn.
 */
export async function createRecipe(req: Request, res: Response, next: NextFunction) {
  const { userId, role } = req.user;
  try {
    const recipe = await createRecipeUseCase.execute(userId, role, req.body);
    return res.status(201).json({
      message: "Tạo công thức thành công",
      recipe: recipe.toProps(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Thích hoặc bỏ thích một công thức nấu ăn.
 */
export async function toggleLikeRecipe(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId } = req.user;
  if (!id) return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    const result = await toggleLikeRecipeUseCase.execute(id, userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Cập nhật thông tin công thức nấu ăn.
 */
export async function updateRecipe(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id) return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    const recipe = await updateRecipeUseCase.execute(id, userId, role, req.body);
    return res.json({
      message: "Cập nhật công thức thành công",
      recipe: recipe.toProps(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Xóa một công thức nấu ăn.
 */
export async function deleteRecipe(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id) return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    await deleteRecipeUseCase.execute(id, userId, role);
    return res.json({ message: "Xóa công thức thành công" });
  } catch (err) {
    next(err);
  }
}

import { Request, Response } from "express";
import { recipeService } from "../services/recipe.service";
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getRecipes(req: Request, res: Response) {
  try {
    const result = await recipeService.list(req.query as any);
    return res.json(result);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getRecipeById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id)
    return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    const recipe = await recipeService.getById(id);
    return res.json(recipe);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function createRecipe(req: Request, res: Response) {
  const { userId, role } = req.user;
  try {
    const recipe = await recipeService.create(userId, role, req.body);
    return res
      .status(201)
      .json({ message: "Tạo công thức thành công", recipe });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function toggleLikeRecipe(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { userId } = req.user;
  if (!id)
    return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    const result = await recipeService.toggleLike(id, userId);
    return res.json(result);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function updateRecipe(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id)
    return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    const recipe = await recipeService.update(id, userId, role, req.body);
    return res.json({ message: "Cập nhật công thức thành công", recipe });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function deleteRecipe(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id)
    return res.status(400).json({ message: "ID công thức không hợp lệ" });

  try {
    await recipeService.delete(id, userId, role);
    return res.json({ message: "Xóa công thức thành công" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

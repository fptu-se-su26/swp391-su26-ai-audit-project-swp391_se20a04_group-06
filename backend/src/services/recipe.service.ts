import { recipeRepository } from "../repositories/recipe.repository";
import { userRepository } from "../repositories/user.repository";
import { HttpError } from "../errors/HttpError";
import { parseId } from "../helpers/response.helper";

export const recipeService = {
  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    difficulty?: string;
    tag?: string;
    authorId?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "12", 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (
      query.difficulty &&
      ["Easy", "Medium", "Hard"].includes(query.difficulty)
    ) {
      filter.difficulty = query.difficulty;
    }
    if (query.tag) {
      filter.tags = query.tag;
    }
    if (query.authorId && parseId(query.authorId)) {
      filter.authorId = query.authorId;
    }

    const sortByScore = !!query.search;
    const { recipes, total } = await recipeRepository.findAll(
      filter,
      skip,
      limit,
      sortByScore,
    );

    return {
      recipes,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string) {
    const recipe = await recipeRepository.findByIdAndIncrementView(id);
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");
    return recipe;
  },

  async create(userId: string, role: string, data: any) {
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    if (role !== "Admin" && !user.isVerified) {
      throw new HttpError(
        403,
        "Chỉ Admin hoặc ngư dân đã xác minh mới được viết công thức nấu ăn",
      );
    }

    return recipeRepository.create({
      title: data.title,
      description: data.description,
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients
        : [data.ingredients],
      instructions: Array.isArray(data.instructions)
        ? data.instructions
        : [data.instructions],
      imageUrl: data.imageUrl || null,
      authorId: userId,
      difficulty: data.difficulty || "Medium",
      cookingTime: data.cookingTime || 30,
      servings: data.servings || 2,
      tags: Array.isArray(data.tags) ? data.tags : [],
    });
  },

  async toggleLike(recipeId: string, userId: string) {
    const recipe = await recipeRepository.findById(recipeId);
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");

    const index = recipe.likes.indexOf(userId as any);
    let liked = false;
    let updatedRecipe;

    if (index === -1) {
      updatedRecipe = await recipeRepository.addLike(recipeId, userId);
      liked = true;
    } else {
      updatedRecipe = await recipeRepository.removeLike(recipeId, userId);
    }

    return { liked, likeCount: updatedRecipe?.likes.length || 0 };
  },

  async update(recipeId: string, userId: string, role: string, data: any) {
    const recipe = await recipeRepository.findById(recipeId);
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");

    if (role !== "Admin" && recipe.authorId._id.toString() !== userId) {
      throw new HttpError(403, "Bạn không có quyền chỉnh sửa công thức này");
    }

    const updates: any = {};
    if (data.title) updates.title = data.title;
    if (data.description) updates.description = data.description;
    if (data.ingredients)
      updates.ingredients = Array.isArray(data.ingredients)
        ? data.ingredients
        : [data.ingredients];
    if (data.instructions)
      updates.instructions = Array.isArray(data.instructions)
        ? data.instructions
        : [data.instructions];
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
    if (data.difficulty) updates.difficulty = data.difficulty;
    if (data.cookingTime) updates.cookingTime = data.cookingTime;
    if (data.servings) updates.servings = data.servings;
    if (data.tags) updates.tags = Array.isArray(data.tags) ? data.tags : [];

    return recipeRepository.update(recipeId, updates);
  },

  async delete(recipeId: string, userId: string, role: string) {
    const recipe = await recipeRepository.findById(recipeId);
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");

    if (role !== "Admin" && recipe.authorId._id.toString() !== userId) {
      throw new HttpError(403, "Bạn không có quyền xóa công thức này");
    }

    await recipeRepository.delete(recipeId);
  },
};

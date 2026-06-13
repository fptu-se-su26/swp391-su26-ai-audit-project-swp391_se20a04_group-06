import { Recipe as MongooseRecipe } from "../models/Recipe";
import { MongooseRecipeRepository } from "../modules/recipe/infrastructure/persistence/mongoose/MongooseRecipeRepository";
import { Recipe as DomainRecipe } from "../modules/recipe/domain/entities/Recipe";

const dddRecipeRepository = new MongooseRecipeRepository();

/**
 * Repository cho Recipe hoạt động như một lớp Chống Tham Nhũng (Anti-Corruption Layer - ACL).
 * Giữ nguyên các hàm đọc (Query) trực tiếp từ Mongoose để đảm bảo hiệu năng tối ưu cho đội ngũ 4 người.
 * Ủy quyền các hàm ghi (Write/Command) cho DDD Aggregate Root để thực thi đúng logic nghiệp vụ.
 */
export const recipeRepository = {
  // ── READ OPERATIONS (Truy vấn tối ưu hóa) ──────────────────────────────────
  async findAll(filter: any, skip: number, limit: number, sortByScore = false) {
    const sortOption: any = sortByScore
      ? { score: { $meta: "textScore" }, createdAt: -1 }
      : { createdAt: -1 };
    const projection: any = sortByScore
      ? { score: { $meta: "textScore" } }
      : {};

    const [recipes, total] = await Promise.all([
      MongooseRecipe.find(filter, projection)
        .populate("authorId", "name avatar isVerified role")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      MongooseRecipe.countDocuments(filter),
    ]);
    return { recipes, total };
  },

  async findById(id: string) {
    return MongooseRecipe.findById(id).populate(
      "authorId",
      "name avatar isVerified role",
    );
  },

  async findByIdAndIncrementView(id: string) {
    return MongooseRecipe.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    ).populate("authorId", "name avatar isVerified role");
  },

  async countDocuments(filter: any): Promise<number> {
    return MongooseRecipe.countDocuments(filter);
  },

  // ── WRITE OPERATIONS (Ủy quyền cho DDD Aggregate & Repository) ──────────────
  async create(data: {
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    imageUrl: string | null;
    authorId: string;
    difficulty: "Easy" | "Medium" | "Hard";
    cookingTime: number;
    servings: number;
    tags: string[];
  }) {
    const domainRecipe = new DomainRecipe({
      title: data.title,
      description: data.description,
      ingredients: data.ingredients,
      instructions: data.instructions,
      imageUrl: data.imageUrl,
      authorId: data.authorId,
      difficulty: data.difficulty,
      cookingTime: data.cookingTime,
      servings: data.servings,
      tags: data.tags,
      likes: [],
      viewCount: 0,
    });

    await dddRecipeRepository.save(domainRecipe);
    return (await MongooseRecipe.findById(domainRecipe.id))!;
  },

  async update(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      ingredients: string[];
      instructions: string[];
      imageUrl: string | null;
      difficulty: "Easy" | "Medium" | "Hard";
      cookingTime: number;
      servings: number;
      tags: string[];
    }>,
  ) {
    const domainRecipe = await dddRecipeRepository.findById(id);
    if (!domainRecipe) return null;

    domainRecipe.update(updates);
    await dddRecipeRepository.save(domainRecipe);

    return MongooseRecipe.findById(id);
  },

  async addLike(recipeId: string, userId: string) {
    const domainRecipe = await dddRecipeRepository.findById(recipeId);
    if (!domainRecipe) return null;

    if (!domainRecipe.likes.includes(userId)) {
      domainRecipe.toggleLike(userId);
      await dddRecipeRepository.save(domainRecipe);
    }
    return MongooseRecipe.findById(recipeId);
  },

  async removeLike(recipeId: string, userId: string) {
    const domainRecipe = await dddRecipeRepository.findById(recipeId);
    if (!domainRecipe) return null;

    if (domainRecipe.likes.includes(userId)) {
      domainRecipe.toggleLike(userId);
      await dddRecipeRepository.save(domainRecipe);
    }
    return MongooseRecipe.findById(recipeId);
  },

  async updateMany(filter: any, update: any, options: any = {}) {
    return MongooseRecipe.updateMany(filter, update, options);
  },

  async deleteMany(filter: any) {
    return MongooseRecipe.deleteMany(filter);
  },

  async delete(id: string) {
    const domainRecipe = await dddRecipeRepository.findById(id);
    if (domainRecipe) {
      await dddRecipeRepository.delete(domainRecipe);
    }
    return true;
  },
};

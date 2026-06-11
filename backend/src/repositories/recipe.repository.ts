import { Recipe } from "../models/Recipe";

export const recipeRepository = {
  async findAll(filter: any, skip: number, limit: number, sortByScore = false) {
    const sortOption: any = sortByScore
      ? { score: { $meta: "textScore" }, createdAt: -1 }
      : { createdAt: -1 };
    const projection: any = sortByScore
      ? { score: { $meta: "textScore" } }
      : {};

    const [recipes, total] = await Promise.all([
      Recipe.find(filter, projection)
        .populate("authorId", "name avatar isVerified role")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Recipe.countDocuments(filter),
    ]);
    return { recipes, total };
  },

  async findById(id: string) {
    return Recipe.findById(id).populate(
      "authorId",
      "name avatar isVerified role",
    );
  },

  async findByIdAndIncrementView(id: string) {
    return Recipe.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    ).populate("authorId", "name avatar isVerified role");
  },

  async create(data: {
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    imageUrl: string | null;
    authorId: string;
    difficulty: string;
    cookingTime: number;
    servings: number;
    tags: string[];
  }) {
    const recipe = new Recipe(data);
    await recipe.save();
    return recipe;
  },

  async update(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      ingredients: string[];
      instructions: string[];
      imageUrl: string | null;
      difficulty: string;
      cookingTime: number;
      servings: number;
      tags: string[];
    }>,
  ) {
    return Recipe.findByIdAndUpdate(id, { $set: updates }, { new: true });
  },

  async addLike(recipeId: string, userId: string) {
    return Recipe.findByIdAndUpdate(
      recipeId,
      { $addToSet: { likes: userId } },
      { new: true },
    );
  },

  async removeLike(recipeId: string, userId: string) {
    return Recipe.findByIdAndUpdate(
      recipeId,
      { $pull: { likes: userId as any } },
      { new: true },
    );
  },

  async updateMany(filter: any, update: any, options: any = {}) {
    return Recipe.updateMany(filter, update, options);
  },

  async deleteMany(filter: any) {
    return Recipe.deleteMany(filter);
  },

  async delete(id: string) {
    return Recipe.findByIdAndDelete(id);
  },
  async countDocuments(filter: any): Promise<number> {
    return Recipe.countDocuments(filter);
  },
};

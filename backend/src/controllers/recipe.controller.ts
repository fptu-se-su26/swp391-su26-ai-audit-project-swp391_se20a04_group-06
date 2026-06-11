import { Request, Response } from "express";
import mongoose from "mongoose";
import { Recipe } from "../models/Recipe";
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const difficulty = req.query.difficulty as string;
  const tag = req.query.tag as string;
  const authorId = req.query.authorId as string;

  try {
    const filter: any = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    if (tag) {
      filter.tags = tag;
    }
    if (authorId && mongoose.Types.ObjectId.isValid(authorId)) {
      filter.authorId = new mongoose.Types.ObjectId(authorId);
    }

    const recipes = await Recipe.find(filter)
      .populate("authorId", "name avatar isVerified role")
      .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Recipe.countDocuments(filter);

    return res.json({
      data: recipes,
      recipes,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getRecipeById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID công thức không hợp lệ" });
  }

  try {
    const recipe = await Recipe.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate("authorId", "name avatar isVerified role");

    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    return res.json(recipe);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function createRecipe(req: Request, res: Response) {
  const { userId, role } = req.user;
  const { title, description, ingredients, instructions, imageUrl, difficulty, cookingTime, servings, tags } = req.body;

  if (!title || !description || !ingredients || !instructions) {
    return res.status(400).json({ message: "Thiếu thông tin công thức bắt buộc" });
  }

  // Verification from implementation plan: Admin and verified users/fishermen can write recipes
  // Let's check user's verification status
  try {
    // If user is not admin, verify if they are a fisherman or a verified user. Or we can just let any logged-in user create, but let's check the proposal:
    // "Cho phép Admin và người dùng đã xác minh/ngư dân chia sẻ"
    // Let's load the user from db to verify.
    // Wait, let's see how User fields are structured.
    const { User } = require("../models/User");
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (role !== "Admin" && !user.isVerified) {
      return res.status(403).json({ message: "Chỉ Admin hoặc người dùng/ngư dân đã xác minh mới được viết công thức nấu ăn" });
    }

    const recipe = new Recipe({
      title,
      description,
      ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
      instructions: Array.isArray(instructions) ? instructions : [instructions],
      imageUrl: imageUrl || null,
      authorId: userId,
      difficulty: difficulty || "Medium",
      cookingTime: cookingTime || 30,
      servings: servings || 2,
      tags: Array.isArray(tags) ? tags : [],
    });

    await recipe.save();
    return res.status(201).json({ message: "Tạo công thức thành công", recipe });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function toggleLikeRecipe(req: Request, res: Response) {
  const { userId } = req.user;
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID công thức không hợp lệ" });
  }

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    const index = recipe.likes.indexOf(userId as any);
    let liked = false;
    if (index === -1) {
      recipe.likes.push(userId as any);
      liked = true;
    } else {
      recipe.likes.splice(index, 1);
    }

    await recipe.save();
    return res.json({ liked, likeCount: recipe.likes.length });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function updateRecipe(req: Request, res: Response) {
  const { userId, role } = req.user;
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID công thức không hợp lệ" });
  }

  const { title, description, ingredients, instructions, imageUrl, difficulty, cookingTime, servings, tags } = req.body;

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    if (role !== "Admin" && recipe.authorId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa công thức này" });
    }

    if (title) recipe.title = title;
    if (description) recipe.description = description;
    if (ingredients) recipe.ingredients = Array.isArray(ingredients) ? ingredients : [ingredients];
    if (instructions) recipe.instructions = Array.isArray(instructions) ? instructions : [instructions];
    if (imageUrl !== undefined) recipe.imageUrl = imageUrl;
    if (difficulty) recipe.difficulty = difficulty;
    if (cookingTime) recipe.cookingTime = cookingTime;
    if (servings) recipe.servings = servings;
    if (tags) recipe.tags = Array.isArray(tags) ? tags : [];

    await recipe.save();
    return res.json({ message: "Cập nhật công thức thành công", recipe });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function deleteRecipe(req: Request, res: Response) {
  const { userId, role } = req.user;
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID công thức không hợp lệ" });
  }

  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    if (role !== "Admin" && recipe.authorId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa công thức này" });
    }

    await recipe.deleteOne();
    return res.json({ message: "Xóa công thức thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

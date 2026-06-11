import { z } from "zod";

export const createRecipeSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    description: z.string().min(1, "Mô tả không được để trống"),
    ingredients: z.union([z.string(), z.array(z.string())]),
    instructions: z.union([z.string(), z.array(z.string())]),
    imageUrl: z.string().optional().nullable(),
    difficulty: z.enum(["Easy", "Medium", "Hard"] as const).optional(),
    cookingTime: z.number().positive().optional(),
    servings: z.number().positive().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateRecipeSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ingredients: z.union([z.string(), z.array(z.string())]).optional(),
    instructions: z.union([z.string(), z.array(z.string())]).optional(),
    imageUrl: z.string().optional().nullable(),
    difficulty: z.enum(["Easy", "Medium", "Hard"] as const).optional(),
    cookingTime: z.number().positive().optional(),
    servings: z.number().positive().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

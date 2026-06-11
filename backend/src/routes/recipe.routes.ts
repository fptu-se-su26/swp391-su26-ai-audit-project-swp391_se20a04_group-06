import { Router } from "express";
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  toggleLikeRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipe.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/", getRecipes);
router.get("/:id", getRecipeById);
router.post("/", authenticate, createRecipe);
router.post("/:id/like", authenticate, toggleLikeRecipe);
router.put("/:id", authenticate, updateRecipe);
router.delete("/:id", authenticate, deleteRecipe);

export default router;

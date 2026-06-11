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
import { validateSchema } from "../middlewares/validate";
import {
  createRecipeSchema,
  updateRecipeSchema,
} from "../validations/recipe.validation";

const router = Router();

router.get("/", getRecipes);
router.get("/:id", getRecipeById);
router.post(
  "/",
  authenticate,
  validateSchema(createRecipeSchema),
  createRecipe,
);
router.post("/:id/like", authenticate, toggleLikeRecipe);
router.put(
  "/:id",
  authenticate,
  validateSchema(updateRecipeSchema),
  updateRecipe,
);
router.delete("/:id", authenticate, deleteRecipe);

export default router;

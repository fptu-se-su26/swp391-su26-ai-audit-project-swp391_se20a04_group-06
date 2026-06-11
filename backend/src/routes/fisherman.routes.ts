import { Router } from "express";
import {
  listFishermen,
  getFishermanProfile,
  getFishermanProducts,
  getFishermanRecipes,
  getFishermanPosts,
  getFishermanBoatLogs,
} from "../controllers/fisherman.controller";

const router = Router();

router.get("/",                listFishermen);
router.get("/:id/profile",     getFishermanProfile);
router.get("/:id/products",    getFishermanProducts);
router.get("/:id/recipes",     getFishermanRecipes);
router.get("/:id/posts",       getFishermanPosts);
router.get("/:id/boat-logs",   getFishermanBoatLogs);

export default router;

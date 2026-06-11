import { Router } from "express";
import {
  getBoatLogs,
  createBoatLog,
  toggleLikeBoatLog,
  deleteBoatLog,
} from "../controllers/boatLog.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/", getBoatLogs);
router.post("/", authenticate, createBoatLog);
router.post("/:id/like", authenticate, toggleLikeBoatLog);
router.delete("/:id", authenticate, deleteBoatLog);

export default router;

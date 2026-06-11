import { Router } from "express";
import {
  getBoatLogs,
  createBoatLog,
  toggleLikeBoatLog,
  deleteBoatLog,
} from "../controllers/boatLog.controller";
import { authenticate } from "../middlewares/auth";
import { validateSchema } from "../middlewares/validate";
import { createBoatLogSchema } from "../validations/boatLog.validation";

const router = Router();

router.get("/", getBoatLogs);
router.post(
  "/",
  authenticate,
  validateSchema(createBoatLogSchema),
  createBoatLog,
);
router.post("/:id/like", authenticate, toggleLikeBoatLog);
router.delete("/:id", authenticate, deleteBoatLog);

export default router;

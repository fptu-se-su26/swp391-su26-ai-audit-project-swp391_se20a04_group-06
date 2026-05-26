import { Router } from "express";
import {
  getNotifications,
  markAllAsRead,
  markSingleAsRead,
} from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/", authenticate, getNotifications);
router.put("/read", authenticate, markAllAsRead);
router.patch("/:id", authenticate, markSingleAsRead); // ← MỚI

export default router;

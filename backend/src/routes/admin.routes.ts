import { Router } from "express";
import {
  listUsers,
  toggleUser,
  verifyUser,
  listAllProducts,
  adminDeleteProduct,
  getStats,
} from "../controllers/admin.controller";
import { authenticate, adminOnly } from "../middlewares/auth";
import {
  broadcastNotification,
  getBroadcastHistory,
} from "../controllers/notification.controller";

const router = Router();

// Áp dụng bộ lọc xác thực và quyền Admin cho tất cả các route bên dưới
router.use(authenticate, adminOnly);

router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id/toggle", toggleUser);
router.patch("/users/:id/verify", verifyUser);
router.get("/listings", listAllProducts);
router.delete("/listings/:id", adminDeleteProduct);

// Các route broadcast (đã tự động được bảo vệ bởi router.use ở trên)
router.post("/notifications/broadcast", broadcastNotification);
router.get("/notifications/broadcasts", getBroadcastHistory);

export default router;

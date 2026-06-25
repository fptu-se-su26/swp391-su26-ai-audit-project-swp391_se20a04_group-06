/**
 * report.routes.ts
 *
 * BUG FIX: GET / và PATCH /:id là các route Admin-only nhưng thiếu middleware adminOnly
 * → bất kỳ user đăng nhập đều có thể xem toàn bộ báo cáo và tự xử lý (resolve/dismiss)
 * Fix: thêm adminOnly middleware
 */
import { Router } from "express";
import {
  createReport,
  getReports,
  handleReport,
} from "../controllers/report.controller";
import { authenticate, adminOnly } from "../middlewares/auth";

const router = Router();

// User tạo báo cáo — chỉ cần đăng nhập
router.post("/:productId", authenticate, createReport);

// ✅ FIX: thêm adminOnly — chỉ Admin mới xem được danh sách báo cáo
router.get("/", authenticate, adminOnly, getReports);

// ✅ FIX: thêm adminOnly — chỉ Admin mới xử lý được báo cáo
router.patch("/:id", authenticate, adminOnly, handleReport);

export default router;

// ─── routes/auth.routes.ts ───────────────────────────────────
import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  me,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import { getUserPublicProfile } from "../controllers/user.controller";

const router = Router();

/* ─── Rate limiting chống brute force login ─── */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: "Đã đăng ký quá nhiều tài khoản. Vui lòng thử lại sau 1 giờ.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

// FIX: Bỏ authenticate — me() tự xử lý token bên trong.
// Khi chưa login → trả 200 + null (không phải 401)
// → Browser không hiển thị lỗi đỏ trong console.
router.get("/me", me);

router.put("/profile", authenticate, upload.single("avatar"), updateProfile);
router.post("/change-password", authenticate, changePassword);

export default router;

// ─── Separate user public router ─────────────────────────────────────────────
export const userRouter = Router();
userRouter.get("/:id", getUserPublicProfile);

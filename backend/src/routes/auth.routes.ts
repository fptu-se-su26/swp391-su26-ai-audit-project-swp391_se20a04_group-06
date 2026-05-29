import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  me,
  refreshToken,
  updateProfile,
  changePassword,
  deleteAccount,
  googleAuth,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";
import { upload, handleUploadError } from "../middlewares/upload";
import { getUserPublicProfile } from "../controllers/user.controller";

const router = Router();

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
router.post("/google", googleAuth);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.get("/me", me);

router.put("/profile", authenticate, upload.single("avatar"), handleUploadError, updateProfile);
router.post("/change-password", authenticate, changePassword);

// 🌟 Định tuyến GDPR: Người dùng tự xóa thông tin tài khoản vĩnh viễn
router.delete("/account", authenticate, deleteAccount);

export default router;

export const userRouter = Router();
userRouter.get("/:id", getUserPublicProfile);

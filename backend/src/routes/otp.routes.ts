import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/otp.controller";

const router = Router();

// Rate limiter bổ sung cho toàn bộ flow reset
// (Rate limit chi tiết từng phone đã xử lý trong otpService)
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/forgot-password  → gửi OTP
router.post("/forgot-password", resetLimiter, forgotPassword);

// POST /api/auth/verify-otp       → xác minh OTP, nhận reset_token
router.post("/verify-otp", resetLimiter, verifyOtp);

// POST /api/auth/reset-password   → đặt mật khẩu mới bằng reset_token
router.post("/reset-password", resetLimiter, resetPassword);

export default router;

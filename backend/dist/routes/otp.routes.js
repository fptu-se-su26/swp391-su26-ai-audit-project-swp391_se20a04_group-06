"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const otp_controller_1 = require("../controllers/otp.controller");
const router = (0, express_1.Router)();
const resetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});
// POST /api/auth/forgot-password  → gửi OTP
router.post("/forgot-password", resetLimiter, otp_controller_1.forgotPassword);
// POST /api/auth/verify-otp       → xác minh OTP, nhận reset_token
router.post("/verify-otp", resetLimiter, otp_controller_1.verifyOtp);
// POST /api/auth/reset-password   → đặt mật khẩu mới bằng reset_token
router.post("/reset-password", resetLimiter, otp_controller_1.resetPassword);
exports.default = router;

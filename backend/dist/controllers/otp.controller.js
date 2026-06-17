"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = forgotPassword;
exports.verifyOtp = verifyOtp;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const otp_service_1 = require("../services/otp.service");
const user_repository_1 = require("../repositories/user.repository");
const response_helper_1 = require("../helpers/response.helper");
const logger_1 = require("../utils/logger");
const redis_1 = require("../config/redis");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: "Email không hợp lệ." });
    }
    const cleanEmail = email.toLowerCase().trim();
    try {
        const exists = await user_repository_1.userRepository.exists({
            email: cleanEmail,
            isActive: true,
        });
        if (!exists) {
            return res.json({
                message: "Nếu địa chỉ email tồn tại, mã xác minh OTP sẽ được gửi đến hòm thư của bạn.",
                ttl: 300,
            });
        }
        await otp_service_1.otpService.sendOtp(cleanEmail);
        return res.json({
            message: "Nếu địa chỉ email tồn tại, mã xác minh OTP sẽ được gửi đến hòm thư của bạn.",
            ttl: 300,
        });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function verifyOtp(req, res) {
    const { email, otp } = req.body;
    if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: "Email không hợp lệ." });
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({ message: "Mã OTP phải là 6 chữ số." });
    }
    const cleanEmail = email.toLowerCase().trim();
    try {
        const resetToken = await otp_service_1.otpService.verifyOtp(cleanEmail, otp);
        return res.json({
            message: "Xác minh thành công.",
            resetToken,
        });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function resetPassword(req, res) {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || typeof resetToken !== "string") {
        return res.status(400).json({ message: "Token không hợp lệ." });
    }
    if (!newPassword || newPassword.length < 6) {
        return res
            .status(400)
            .json({ message: "Mật khẩu mới phải ít nhất 6 ký tự." });
    }
    try {
        const email = await otp_service_1.otpService.getEmailByResetToken(resetToken);
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy tài khoản người dùng." });
        }
        const hash = await bcryptjs_1.default.hash(newPassword, 10);
        await user_repository_1.userRepository.updatePassword(user.userId, hash);
        let cursor = "0";
        const keys = [];
        do {
            const reply = await redis_1.redis.scan(cursor, "MATCH", `auth:refresh:${user.userId}:*`, "COUNT", 100);
            cursor = reply[0];
            keys.push(...reply[1]);
        } while (cursor !== "0");
        if (keys.length > 0) {
            await redis_1.redis.del(...keys);
        }
        await otp_service_1.otpService.consumeResetToken(resetToken);
        logger_1.logger.info(`Password reset successfully and all active sessions revoked safely for UserID=${user.userId}`);
        return res.json({
            message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.",
        });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

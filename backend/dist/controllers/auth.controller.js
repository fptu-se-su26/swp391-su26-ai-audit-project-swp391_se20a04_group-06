"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.deleteAccount = deleteAccount;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.me = me;
exports.refreshToken = refreshToken;
exports.googleAuth = googleAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const auth_service_1 = require("../services/auth.service");
const user_repository_1 = require("../repositories/user.repository");
const redis_1 = require("../config/redis");
const response_helper_1 = require("../helpers/response.helper");
const cookie_1 = require("../config/cookie");
const csrf_1 = require("../middlewares/csrf");
const logger_1 = require("../utils/logger");
const ACCESS_COOKIE_OPTS = {
    ...cookie_1.AUTH_COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
};
const REFRESH_COOKIE_OPTS = {
    ...cookie_1.AUTH_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
async function register(req, res) {
    const { name, email, password } = req.body;
    try {
        const user = await auth_service_1.authService.register(name, email, password);
        const accessToken = auth_service_1.authService.signToken(user.userId, user.role);
        const refreshToken = crypto_1.default.randomBytes(40).toString("hex");
        await redis_1.redis.set(`auth:refresh:${user.userId}:${refreshToken}`, "1", "EX", 7 * 24 * 3600);
        res.cookie("token", accessToken, ACCESS_COOKIE_OPTS);
        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
        (0, csrf_1.rotateCsrfToken)(res);
        logger_1.logger.info(`User registered successfully: ID=${user.userId}, Email=${email}`);
        return res.status(201).json({ user });
    }
    catch (err) {
        logger_1.logger.error(`Registration failed: ${err.message}`);
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function login(req, res) {
    const { email, password } = req.body;
    try {
        const user = await auth_service_1.authService.login(email, password);
        const accessToken = auth_service_1.authService.signToken(user.userId, user.role);
        const refreshToken = crypto_1.default.randomBytes(40).toString("hex");
        await redis_1.redis.set(`auth:refresh:${user.userId}:${refreshToken}`, "1", "EX", 7 * 24 * 3600);
        res.cookie("token", accessToken, ACCESS_COOKIE_OPTS);
        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
        logger_1.logger.info(`User logged in: ID=${user.userId}`);
        return res.json({ user });
    }
    catch (err) {
        logger_1.logger.error(`Login failed for Email=${email}: ${err.message}`);
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function logout(req, res) {
    const oldRefreshToken = req.cookies?.refreshToken;
    const token = req.cookies?.token;
    if (oldRefreshToken) {
        let userId = null;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, {
                    ignoreExpiration: true,
                });
                userId = decoded?.userId || null;
            }
            catch (err) { }
        }
        try {
            if (userId) {
                await redis_1.redis.del(`auth:refresh:${userId}:${oldRefreshToken}`);
                logger_1.logger.info(`Tokens revoked in Redis on logout for UserID=${userId}`);
            }
        }
        catch (err) {
            logger_1.logger.error(`Token revocation error in Redis on logout: ${err.message}`);
        }
    }
    res.clearCookie("token", cookie_1.CLEAR_COOKIE_OPTIONS);
    res.clearCookie("refreshToken", cookie_1.CLEAR_COOKIE_OPTIONS);
    res.clearCookie("csrfToken", {
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    return res.json({ message: "Đã đăng xuất thành công!" });
}
async function deleteAccount(req, res) {
    const { userId } = req.user;
    try {
        await auth_service_1.authService.deleteAccount(userId);
        res.clearCookie("token", cookie_1.CLEAR_COOKIE_OPTIONS);
        res.clearCookie("refreshToken", cookie_1.CLEAR_COOKIE_OPTIONS);
        res.clearCookie("csrfToken", {
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        logger_1.logger.info(`GDPR: User account deleted permanently: ID=${userId}`);
        return res.json({
            message: "Tài khoản và toàn bộ dữ liệu của bạn đã được xóa vĩnh viễn thành công.",
        });
    }
    catch (err) {
        logger_1.logger.error(`GDPR: Deletion failed for UserID=${userId}: ${err.message}`);
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function updateProfile(req, res) {
    const { userId } = req.user;
    const { name, email } = req.body;
    try {
        const result = await auth_service_1.authService.updateProfile(userId, {
            name: name.trim(),
            email,
            fileBuffer: req.file?.buffer,
        });
        logger_1.logger.info(`Profile updated for UserID=${userId}`);
        return res.json({ message: "Cập nhật tài khoản thành công", ...result });
    }
    catch (err) {
        logger_1.logger.error(`Profile update failed: ${err.message}`);
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function changePassword(req, res) {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;
    try {
        await auth_service_1.authService.changePassword(userId, currentPassword, newPassword);
        let cursor = "0";
        const keys = [];
        do {
            const reply = await redis_1.redis.scan(cursor, "MATCH", `auth:refresh:${userId}:*`, "COUNT", 100);
            cursor = reply[0];
            keys.push(...reply[1]);
        } while (cursor !== "0");
        if (keys.length > 0) {
            await redis_1.redis.del(...keys);
        }
        logger_1.logger.info(`Password changed and all active sessions revoked safely for UserID=${userId}`);
        res.clearCookie("token", cookie_1.CLEAR_COOKIE_OPTIONS);
        res.clearCookie("refreshToken", cookie_1.CLEAR_COOKIE_OPTIONS);
        return res.json({
            message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.",
        });
    }
    catch (err) {
        logger_1.logger.error(`Password change failed: ${err.message}`);
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function me(req, res) {
    const token = req.cookies?.token;
    if (!token)
        return res.status(401).json({ message: "Chưa đăng nhập" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await user_repository_1.userRepository.findById(payload.userId);
        return res.json(user ?? null);
    }
    catch (err) {
        logger_1.logger.warn(`Invalid access token provided: ${err.message}`);
        return res.status(401).json({ message: "Access Token hết hạn" });
    }
}
async function refreshToken(req, res) {
    const oldRefreshToken = req.cookies?.refreshToken;
    const token = req.cookies?.token;
    if (!oldRefreshToken || !token) {
        return res.status(401).json({ message: "Phiên làm việc hết hạn" });
    }
    try {
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, {
                ignoreExpiration: true,
            });
        }
        catch (verifyErr) {
            logger_1.logger.warn(`refreshToken: invalid signature — ${verifyErr.message}`);
            res.clearCookie("token", cookie_1.CLEAR_COOKIE_OPTIONS);
            res.clearCookie("refreshToken", cookie_1.CLEAR_COOKIE_OPTIONS);
            return res.status(401).json({ message: "Token không hợp lệ" });
        }
        if (!decoded?.userId) {
            return res.status(401).json({ message: "Token không hợp lệ" });
        }
        const redisKey = `auth:refresh:${decoded.userId}:${oldRefreshToken}`;
        const tokenExists = await redis_1.redis.exists(redisKey);
        if (!tokenExists) {
            let cursor = "0";
            const keys = [];
            do {
                const reply = await redis_1.redis.scan(cursor, "MATCH", `auth:refresh:${decoded.userId}:*`, "COUNT", 100);
                cursor = reply[0];
                keys.push(...reply[1]);
            } while (cursor !== "0");
            if (keys.length > 0) {
                await redis_1.redis.del(...keys);
            }
            res.clearCookie("token", cookie_1.CLEAR_COOKIE_OPTIONS);
            res.clearCookie("refreshToken", cookie_1.CLEAR_COOKIE_OPTIONS);
            logger_1.logger.warn(`Potential token reuse detected. Revoking all tokens safely for UserID=${decoded.userId}`);
            return res.status(403).json({
                message: "Phátional Token đã qua sử dụng. Vui lòng đăng nhập lại để đảm bảo an toàn.",
            });
        }
        await redis_1.redis.del(redisKey);
        const newAccessToken = auth_service_1.authService.signToken(decoded.userId, decoded.role);
        const newRefreshToken = crypto_1.default.randomBytes(40).toString("hex");
        await redis_1.redis.set(`auth:refresh:${decoded.userId}:${newRefreshToken}`, "1", "EX", 7 * 24 * 3600);
        res.cookie("token", newAccessToken, ACCESS_COOKIE_OPTS);
        res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTS);
        (0, csrf_1.rotateCsrfToken)(res);
        return res.json({ status: "refreshed" });
    }
    catch (err) {
        logger_1.logger.error(`Token refresh failed: ${err.message}`);
        return res.status(401).json({ message: "Lỗi xác thực lại" });
    }
}
async function googleAuth(req, res) {
    const { idToken } = req.body;
    if (!idToken) {
        return res
            .status(400)
            .json({ message: "Thiếu ID Token bảo mật từ Google" });
    }
    try {
        // Chuyển giao toàn bộ logic phân tích token và tạo tài khoản sang tầng Service xử lý
        const authResult = await auth_service_1.authService.googleAuth(idToken);
        const accessToken = auth_service_1.authService.signToken(authResult.userId, authResult.role);
        const refreshToken = crypto_1.default.randomBytes(40).toString("hex");
        await redis_1.redis.set(`auth:refresh:${authResult.userId}:${refreshToken}`, "1", "EX", 7 * 24 * 3600);
        res.cookie("token", accessToken, ACCESS_COOKIE_OPTS);
        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
        return res.json({ user: authResult });
    }
    catch (err) {
        logger_1.logger.error(`Google Sign-In failed: ${err.message}`);
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

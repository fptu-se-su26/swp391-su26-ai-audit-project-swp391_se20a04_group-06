"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.adminOnly = adminOnly;
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/* Gắn user vào req sau khi verify JWT */
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Chưa đăng nhập' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
}
/* Chỉ cho Admin qua */
function adminOnly(req, res, next) {
    const user = req.user;
    if (user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Chỉ Admin mới có quyền này' });
    }
    next();
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
/* ─── POST /api/auth/register ─── */
async function register(req, res) {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password)
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu' });
    if (!/^0\d{9}$/.test(phone))
        return res.status(400).json({ message: 'Số điện thoại phải là 10 số, bắt đầu bằng 0' });
    if (password.length < 6)
        return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });
    try {
        const [rows] = await db_1.pool.query('SELECT UserID FROM User WHERE Phone = ?', [phone]);
        if (rows.length > 0)
            return res.status(409).json({ message: 'Số điện thoại đã được đăng ký' });
        const hash = await bcryptjs_1.default.hash(password, 10);
        const [result] = await db_1.pool.query('INSERT INTO User (Name, Phone, PasswordHash, Role) VALUES (?, ?, ?, "User")', [name.trim(), phone, hash]);
        const userId = result.insertId;
        const token = signToken(userId, 'User');
        return res.status(201).json({ token, user: { id: userId, name, phone, role: 'User' } });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── POST /api/auth/login ─── */
async function login(req, res) {
    const { phone, password } = req.body;
    if (!phone || !password)
        return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu' });
    try {
        const [rows] = await db_1.pool.query('SELECT UserID, Name, Phone, PasswordHash, Role, IsActive FROM User WHERE Phone = ?', [phone]);
        const user = rows[0];
        if (!user)
            return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng' });
        if (!user.IsActive)
            return res.status(403).json({ message: 'Tài khoản đã bị khoá. Vui lòng liên hệ admin.' });
        const ok = await bcryptjs_1.default.compare(password, user.PasswordHash);
        if (!ok)
            return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng' });
        const token = signToken(user.UserID, user.Role);
        return res.json({
            token,
            user: { id: user.UserID, name: user.Name, phone: user.Phone, role: user.Role },
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── GET /api/auth/me ─── */
async function me(req, res) {
    const userId = req.user.userId;
    try {
        const [rows] = await db_1.pool.query('SELECT UserID as id, Name as name, Phone as phone, Role as role FROM User WHERE UserID = ?', [userId]);
        if (!rows[0])
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        return res.json(rows[0]);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}
/* ─── helper ─── */
function signToken(userId, role) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET chưa được cấu hình trong file .env');
    }
    return jsonwebtoken_1.default.sign({ userId, role }, secret, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') });
}

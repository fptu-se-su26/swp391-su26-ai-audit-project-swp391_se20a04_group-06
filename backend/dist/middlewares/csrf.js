"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.validateCsrf = validateCsrf;
exports.rotateCsrfToken = rotateCsrfToken;
const crypto_1 = __importDefault(require("crypto"));
const security_1 = require("../utils/security");
const CSRF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const csrfCookieOptions = () => ({
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: CSRF_MAX_AGE_MS,
});
/**
 * Double-submit cookie: the browser receives a readable CSRF cookie and must
 * echo the same value in the x-csrf-token header for unsafe requests.
 */
function generateCsrfToken(req, res, next) {
    const token = req.cookies.csrfToken || crypto_1.default.randomBytes(32).toString("hex");
    if (!req.cookies.csrfToken) {
        res.cookie("csrfToken", token, csrfCookieOptions());
    }
    req.csrfToken = token;
    next();
}
function validateCsrf(req, res, next) {
    const clientToken = req.headers["x-csrf-token"];
    const serverToken = req.cookies.csrfToken;
    if (!clientToken || !serverToken || !(0, security_1.safeCompare)(clientToken, serverToken)) {
        return res.status(403).json({
            code: "CSRF_INVALID",
            message: "CSRF token không hợp lệ",
        });
    }
    next();
}
function rotateCsrfToken(res) {
    const newToken = crypto_1.default.randomBytes(32).toString("hex");
    res.cookie("csrfToken", newToken, csrfCookieOptions());
    return newToken;
}

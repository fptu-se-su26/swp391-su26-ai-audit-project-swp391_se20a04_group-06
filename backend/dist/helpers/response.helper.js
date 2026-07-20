"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendServerError = sendServerError;
exports.parseId = parseId;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
// Phản hồi lỗi hệ thống HTTP 500 kèm ghi log chi tiết
function sendServerError(res, err) {
    logger_1.logger.error(`Internal Server Error: ${err instanceof Error ? err.stack || err.message : String(err)}`);
    return res.status(500).json({ message: "Lỗi máy chủ" });
}
// Kiểm tra và trả về chuỗi ID nếu đúng định dạng MongoDB ObjectId
function parseId(raw) {
    if (!raw)
        return undefined;
    return mongoose_1.default.Types.ObjectId.isValid(raw) ? raw : undefined;
}

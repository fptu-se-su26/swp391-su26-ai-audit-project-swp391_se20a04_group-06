"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoatLogs = getBoatLogs;
exports.createBoatLog = createBoatLog;
exports.toggleLikeBoatLog = toggleLikeBoatLog;
exports.deleteBoatLog = deleteBoatLog;
const boatLog_service_1 = require("../services/boatLog.service");
const response_helper_1 = require("../helpers/response.helper");
async function getBoatLogs(req, res) {
    try {
        const result = await boatLog_service_1.boatLogService.list(req.query);
        return res.json(result);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function createBoatLog(req, res) {
    const { userId } = req.user;
    try {
        const log = await boatLog_service_1.boatLogService.create(userId, req.body);
        return res
            .status(201)
            .json({ message: "Đăng nhật ký cabin thành công", boatLog: log });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function toggleLikeBoatLog(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    const { userId } = req.user;
    if (!id)
        return res.status(400).json({ message: "ID nhật ký không hợp lệ" });
    try {
        const result = await boatLog_service_1.boatLogService.toggleLike(id, userId);
        return res.json(result);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function deleteBoatLog(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    const { userId, role } = req.user;
    if (!id)
        return res.status(400).json({ message: "ID nhật ký không hợp lệ" });
    try {
        await boatLog_service_1.boatLogService.delete(id, userId, role);
        return res.json({ message: "Xóa nhật ký cabin thành công" });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

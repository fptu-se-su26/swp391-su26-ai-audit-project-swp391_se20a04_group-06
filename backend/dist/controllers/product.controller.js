"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProductById = getProductById;
exports.getProductPriceHistory = getProductPriceHistory;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.getMyProducts = getMyProducts;
exports.getTodayCount = getTodayCount;
exports.bumpProduct = bumpProduct;
const product_service_1 = require("../services/product.service");
const response_helper_1 = require("../helpers/response.helper");
const pagination_1 = require("../utils/pagination");
async function getProducts(req, res) {
    try {
        const result = await product_service_1.productService.list(req.query);
        return res.json(result);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function getProductById(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    if (!id)
        return res.status(400).json({ message: "ID mẻ hàng không hợp lệ" });
    try {
        const product = await product_service_1.productService.getById(id);
        return res.json(product);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function getProductPriceHistory(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    if (!id)
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    try {
        const history = await product_service_1.productService.getPriceHistory(id);
        return res.json(history.map((h) => ({
            oldPrice: h.oldPrice,
            newPrice: h.newPrice,
            changedAt: h.changedAt,
        })));
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function createProduct(req, res) {
    try {
        const result = await product_service_1.productService.create(req.user.userId, req.body);
        return res.status(201).json({ message: "Đăng bài thành công", ...result });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function updateProduct(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    if (!id)
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    try {
        await product_service_1.productService.update(id, req.user.userId, req.user.role, req.body);
        return res.json({ message: "Cập nhật thành công" });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function deleteProduct(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    if (!id)
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    try {
        await product_service_1.productService.delete(id, req.user.userId, req.user.role);
        return res.json({ message: "Đã xoá bài đăng" });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function getMyProducts(req, res) {
    const rawPage = typeof req.query.page === "string" ? req.query.page : undefined;
    const rawLimit = typeof req.query.limit === "string" ? req.query.limit : undefined;
    try {
        const { products, total, page, limit } = await product_service_1.productService.getProducts(req.user.userId, rawPage, rawLimit);
        return res.json((0, pagination_1.paginatedResponse)(products, total, page, limit));
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function getTodayCount(req, res) {
    try {
        const userId = req.user.userId;
        const stats = await product_service_1.productService.getTodayCount(userId);
        return res.json(stats);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function bumpProduct(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    if (!id)
        return res.status(400).json({ message: "ID không hợp lệ" });
    try {
        await product_service_1.productService.bump(id, req.user.userId);
        return res.json({ message: "Đã đẩy tin thành công!" });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

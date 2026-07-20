"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.paginatedResponse = paginatedResponse;
// Parse và validate tham số phân trang từ request query
function parsePagination(rawPage, rawLimit, maxLimit = 100) {
    const parsedPage = parseInt(rawPage || '1', 10);
    const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const parsedLimit = parseInt(rawLimit || '20', 10);
    const limit = isNaN(parsedLimit) ? 20 : Math.min(maxLimit, Math.max(1, parsedLimit));
    return { page, limit, offset: (page - 1) * limit };
}
// Định dạng phản hồi phân trang chuẩn cho API client
function paginatedResponse(data, total, page, limit) {
    return {
        data,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}

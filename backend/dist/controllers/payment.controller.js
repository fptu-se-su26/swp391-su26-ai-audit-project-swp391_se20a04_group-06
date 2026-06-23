"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sepayWebhook = sepayWebhook;
// Import model Mongoose PaymentTransaction để lưu thông tin lịch sử giao dịch thanh toán
const PaymentTransaction_1 = require("../models/PaymentTransaction");
// Import logger để ghi nhận lại nhật ký xử lý giao dịch hoặc lỗi bảo mật
const logger_1 = require("../utils/logger");
// Import hàm so sánh chuỗi an toàn ngăn chặn Timing Attack khi xác thực Webhook
const security_1 = require("../utils/security");
// Import DDD UserRepository để làm việc với mô hình miền domain (Aggregate Root) của IAM
const MongooseUserRepository_1 = require("../modules/iam/infrastructure/persistence/mongoose/MongooseUserRepository");
// Import bộ điều phối sự kiện Domain (DomainEvents) nhằm phát sự kiện nâng cấp tài khoản Premium
const DomainEvents_1 = require("../shared/domain/events/DomainEvents");
// Khởi tạo thực thể Repository theo chuẩn kiến trúc Domain-Driven Design (DDD)
const dddUserRepository = new MongooseUserRepository_1.MongooseUserRepository();
/**
 * HÀM WEBHOOK XỬ LÝ THANH TOÁN TỰ ĐỘNG TỪ CỔNG THANH TOÁN SEPAY (BANK TRANSFER AUTOMATION)
 */
async function sepayWebhook(req, res) {
    try {
        // 1. KIỂM TRA HEADER CHỨA APY KEY XÁC THỰC WEBHOOK
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            logger_1.logger.warn("[Sepay Webhook] Missing Authorization header");
            return res.status(401).json({ message: "Missing Authorization header" });
        }
        // Tách token API Key từ header (hỗ trợ cả tiền tố "Bearer " và "ApiKey ")
        let token = authHeader;
        if (authHeader.toLowerCase().startsWith("bearer ")) {
            token = authHeader.substring(7);
        }
        else if (authHeader.toLowerCase().startsWith("apikey ")) {
            token = authHeader.substring(7);
        }
        token = token.trim();
        // Lấy API Key mong đợi được định nghĩa sẵn trong biến môi trường
        const expectedKey = process.env.SEPAY_WEBHOOK_KEY;
        if (!expectedKey) {
            logger_1.logger.error("[Sepay Webhook] CRITICAL: SEPAY_WEBHOOK_KEY is not configured.");
            return res.status(500).json({ message: "Server misconfiguration" });
        }
        // Sử dụng thuật toán safeCompare so sánh chuỗi thời gian cố định nhằm chống Timing Attack (tấn công phân tích thời gian phản hồi)
        if (!(0, security_1.safeCompare)(token, expectedKey)) {
            logger_1.logger.warn(`[Sepay Webhook] Unauthorized request. Invalid API Key.`);
            return res.status(401).json({ message: "Invalid API Key" });
        }
        // 2. GIẢI NÉN VÀ CHUẨN HÓA DỮ LIỆU GIAO DỊCH TỪ BODY CỦA SEPAY GỬI LÊN
        const { id, transferAmount, amount, content, description } = req.body;
        const finalAmount = transferAmount ?? amount; // Số tiền chuyển (ưu tiên transferAmount từ Sepay)
        const finalContent = content ?? description; // Nội dung chuyển khoản (chứa mã người dùng)
        const gatewayTransactionId = id ? String(id).trim() : null; // Mã giao dịch duy nhất từ ngân hàng/cổng Sepay
        logger_1.logger.info(`[Sepay Webhook] Received transaction check. GatewayID: ${gatewayTransactionId}, Amount: ${finalAmount}, Content: "${finalContent}"`);
        // Validate: kiểm tra mã giao dịch duy nhất của cổng thanh toán
        if (!gatewayTransactionId) {
            logger_1.logger.error("[Sepay Webhook] Rejected: Missing unique gateway transaction ID.");
            return res
                .status(400)
                .json({ message: "Missing gateway transaction ID" });
        }
        // Validate: kiểm tra số tiền và nội dung chuyển khoản phải tồn tại
        if (finalAmount === undefined || finalContent === undefined) {
            logger_1.logger.warn("[Sepay Webhook] Missing amount or content field in request body");
            return res
                .status(400)
                .json({ message: "Missing required transaction fields" });
        }
        // 3. KIỂM TRA TRÙNG LẶP GIAO DỊCH (IDEMPOTENCY KEY)
        // Nếu giao dịch này đã được ghi nhận và xử lý trước đó, trả về HTTP 200 để tránh xử lý trùng (nạp tiền 2 lần)
        const existingTx = await PaymentTransaction_1.PaymentTransaction.findOne({
            gatewayTransactionId,
        });
        if (existingTx) {
            logger_1.logger.warn(`[Sepay Webhook] Duplicate transaction detected for GatewayID: ${gatewayTransactionId}. Safe return HTTP 200.`);
            return res
                .status(200)
                .json({ success: true, message: "Transaction already processed" });
        }
        // Validate: kiểm tra số tiền thanh toán (tối thiểu là 2,000 VND)
        const numericAmount = Number(finalAmount);
        if (isNaN(numericAmount) || numericAmount < 2000) {
            logger_1.logger.warn(`[Sepay Webhook] Invalid transfer amount: ${finalAmount}. Must be >= 2000 VND`);
            return res
                .status(400)
                .json({ message: "Transfer amount must be at least 2000 VND" });
        }
        // 4. TRÍCH XUẤT ID NGƯỜI DÙNG TỪ NỘI DUNG CHUYỂN KHOẢN
        // Dùng biểu thức chính quy (Regex) tìm chuỗi hex dài đúng 24 ký tự (chuẩn ObjectId của MongoDB) trong nội dung chuyển khoản
        const match = String(finalContent).match(/[0-9a-fA-F]{24}/);
        if (!match) {
            logger_1.logger.warn(`[Sepay Webhook] No valid User MongoDB ID found in content: "${finalContent}"`);
            return res.status(400).json({
                message: "No valid user identifier found in transaction description",
            });
        }
        const userId = match[0]; // Lấy ra chuỗi 24 ký tự tìm thấy làm ID người dùng cần nâng cấp
        // Tìm kiếm người dùng trong Database theo mô hình miền DDD
        const user = await dddUserRepository.findById(userId);
        if (!user) {
            logger_1.logger.error(`[Sepay Webhook] User with ID ${userId} not found in database`);
            return res.status(404).json({ message: "User not found" });
        }
        // 5. THỰC HIỆN NÂNG CẤP PREMIUM CHO NGƯỜI DÙNG
        // Nếu người dùng đã là thành viên Premium từ trước
        if (user.isPremium) {
            logger_1.logger.info(`[Sepay Webhook] User ${user.name} (${userId}) is already Premium.`);
            // Vẫn tạo bản ghi giao dịch thanh toán để làm lịch sử đối soát hóa đơn
            await PaymentTransaction_1.PaymentTransaction.create({
                gatewayTransactionId,
                userId: user.id,
                amount: numericAmount,
                content: finalContent,
            });
            return res
                .status(200)
                .json({ success: true, message: "User is already premium" });
        }
        // Gọi phương thức nghiệp vụ nâng cấp Premium ở thực thể Domain (tự động cập nhật cờ isPremium và thời gian hết hạn)
        user.upgradeToPremium();
        // Lưu lại trạng thái người dùng mới thông qua DDD Repository
        await dddUserRepository.save(user);
        // Kích hoạt phát tán sự kiện Domain nhằm cập nhật/thu hồi các phiên làm việc (token) cũ của người dùng trên Redis
        DomainEvents_1.DomainEvents.dispatchEventsForAggregate(user.id);
        // Lưu trữ thông tin giao dịch thanh toán mới vào MongoDB
        await PaymentTransaction_1.PaymentTransaction.create({
            gatewayTransactionId,
            userId: user.id,
            amount: numericAmount,
            content: finalContent,
        });
        logger_1.logger.info(`[Sepay Webhook] SUCCESS! User ${user.name} (${userId}) upgraded to Premium. GatewayID: ${gatewayTransactionId}`);
        // Phản hồi phản hồi thành công hoàn tất giao dịch
        return res.status(200).json({
            success: true,
            message: `User ${user.name} upgraded to Premium successfully`,
        });
    }
    catch (err) {
        // Ghi log chi tiết lỗi nghiêm trọng kèm stack trace
        logger_1.logger.error(`[Sepay Webhook] CRITICAL Error: ${err.message}`, {
            stack: err.stack,
        });
        return res.status(500).json({ message: "Internal server error" });
    }
}

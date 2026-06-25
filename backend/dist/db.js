"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = void 0;
// Import thư viện mongoose để tương tác với cơ sở dữ liệu MongoDB
const mongoose_1 = __importDefault(require("mongoose"));
// Import logger phục vụ ghi log hệ thống
const logger_1 = require("./utils/logger");
// Định nghĩa và xuất hàm testConnection thực hiện kết nối tới MongoDB
const testConnection = async () => {
    // Lấy đường dẫn kết nối MongoDB từ biến môi trường MONGO_URI, mặc định kết nối localhost nếu thiếu
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/seafood_db";
    try {
        // Chờ kết nối MongoDB thông qua Mongoose với cấu hình bổ sung
        await mongoose_1.default.connect(mongoUri, {
            // Tự động đồng bộ xây dựng các chỉ mục (như 2dsphere cho GPS và text cho tìm kiếm toàn văn) khi khởi chạy ứng dụng
            autoIndex: true,
        });
        // Ghi nhận log thông báo kết nối cơ sở dữ liệu MongoDB thành công
        logger_1.logger.info("✅ MongoDB connected successfully via Mongoose");
        // Thử dọn dẹp và xóa bỏ chỉ mục duy nhất 'phone_1' (nếu tồn tại) của phiên bản cũ để tránh lỗi xung đột số điện thoại rỗng
        try {
            // Truy cập trực tiếp vào collection "users" từ kết nối Mongoose hiện hành
            const usersCollection = mongoose_1.default.connection.collection("users");
            // Truy vấn danh sách toàn bộ các chỉ mục indexes hiện có của bảng users
            const indexes = await usersCollection.indexes();
            // Kiểm tra xem có tồn tại chỉ mục nào có tên là "phone_1" hay không
            const hasPhoneIndex = indexes.some(idx => idx.name === "phone_1");
            // Nếu tồn tại chỉ mục cũ "phone_1"
            if (hasPhoneIndex) {
                // Thực hiện xóa bỏ chỉ mục này khỏi database
                await usersCollection.dropIndex("phone_1");
                // Ghi nhận log đã xóa thành công chỉ mục cũ
                logger_1.logger.info("🗑️ Dropped legacy unique index 'phone_1' successfully");
            }
        }
        catch (indexErr) {
            // Ghi log cảnh báo nếu không xóa được chỉ mục (có thể do chỉ mục không tồn tại)
            logger_1.logger.warn(`Could not drop phone_1 index (it might not exist): ${indexErr.message}`);
        }
    }
    catch (err) {
        // Ghi log lỗi nghiêm trọng nếu kết nối cơ sở dữ liệu thất bại
        logger_1.logger.error(`❌ MongoDB connection failed: ${err.message}`);
        // Thoát tiến trình ngay lập tức với mã lỗi 1 để hệ thống quản lý container tự động khởi động lại ứng dụng
        process.exit(1);
    }
};
exports.testConnection = testConnection;

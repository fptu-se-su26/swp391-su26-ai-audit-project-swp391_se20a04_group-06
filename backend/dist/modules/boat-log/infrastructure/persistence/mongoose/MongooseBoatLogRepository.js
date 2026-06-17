"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseBoatLogRepository = void 0;
// Import Mongoose model BoatLog từ thư mục models để gọi trực tiếp các lệnh truy vấn MongoDB
const BoatLog_1 = require("../../../../../models/BoatLog");
// Import lớp mapper BoatLogMapper để chuyển đổi dữ liệu qua lại giữa Mongoose và Domain
const BoatLogMapper_1 = require("./mappers/BoatLogMapper");
// Import thư viện mongoose để kiểm tra tính hợp lệ của định dạng ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
// Triển khai lớp MongooseBoatLogRepository thực thi tất cả các phương thức lưu trữ của IBoatLogRepository
class MongooseBoatLogRepository {
    // Phương thức bất đồng bộ tìm kiếm nhật ký cabin theo ID duy nhất
    async findById(id) {
        // Nếu ID truyền vào không đúng định dạng ObjectId của MongoDB, trả về null ngay lập tức
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return null;
        // Tìm kiếm tài liệu document trong MongoDB bằng phương thức findById của Mongoose model
        const doc = await BoatLog_1.BoatLog.findById(id);
        // Nếu không tồn tại tài liệu nào khớp trong DB, trả về null
        if (!doc)
            return null;
        // Chuyển đổi tài liệu Mongoose thô tìm được thành thực thể giàu nghiệp vụ Domain BoatLog và trả về
        return BoatLogMapper_1.BoatLogMapper.toDomain(doc);
    }
    // Phương thức bất đồng bộ lưu mới hoặc cập nhật thông tin nhật ký cabin
    async save(boatLog) {
        // Chuyển đổi dữ liệu từ thực thể miền Domain thành đối tượng thô phù hợp Schema của Mongoose
        const persistenceData = BoatLogMapper_1.BoatLogMapper.toPersistence(boatLog);
        // Nếu thực thể đã có ID hợp lệ (nghĩa là đã tồn tại trong DB, đây là hành động cập nhật)
        if (boatLog.id && mongoose_1.default.Types.ObjectId.isValid(boatLog.id)) {
            // Thực hiện tìm kiếm và cập nhật dữ liệu tài liệu hiện tại trong DB
            await BoatLog_1.BoatLog.findByIdAndUpdate(
            // Mã ID tài liệu cần cập nhật
            boatLog.id, 
            // Gán đè các trường thông tin dữ liệu mới
            { $set: persistenceData }, 
            // Kích hoạt tính năng upsert (tạo mới nếu chưa có) và trả về tài liệu mới nhất sau khi sửa
            { upsert: true, new: true });
        }
        else {
            // Nếu chưa có ID (đăng nhật ký mới), khởi tạo một Mongoose document mới với dữ liệu thô
            const doc = new BoatLog_1.BoatLog(persistenceData);
            // Lưu trữ tài liệu mới này xuống cơ sở dữ liệu MongoDB
            await doc.save();
            // Gán ngược mã ID dạng chuỗi sinh ra từ DB vào thuộc tính nội bộ _id của đối tượng thực thể miền
            boatLog._id = doc._id.toString();
        }
    }
    // Phương thức bất đồng bộ xóa bỏ nhật ký cabin khỏi cơ sở dữ liệu
    async delete(boatLog) {
        // Nếu thực thể tồn tại ID và ID đó đúng định dạng ObjectId của MongoDB
        if (boatLog.id && mongoose_1.default.Types.ObjectId.isValid(boatLog.id)) {
            // Thực hiện lệnh tìm kiếm và xóa bỏ tài liệu khỏi DB MongoDB
            await BoatLog_1.BoatLog.findByIdAndDelete(boatLog.id);
        }
    }
}
exports.MongooseBoatLogRepository = MongooseBoatLogRepository;

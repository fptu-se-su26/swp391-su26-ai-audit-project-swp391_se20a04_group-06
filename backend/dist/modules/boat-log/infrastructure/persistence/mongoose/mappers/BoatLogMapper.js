"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoatLogMapper = void 0;
// Import thực thể Domain BoatLog để chuyển đổi từ dữ liệu database sang
const BoatLog_1 = require("../../../../domain/entities/BoatLog");
// Import thư viện mongoose để thực hiện ép kiểu ObjectId cho các trường liên kết dữ liệu
const mongoose_1 = __importDefault(require("mongoose"));
// Định nghĩa lớp mapper chịu trách nhiệm chuyển đổi dữ liệu qua lại giữa tầng Mongoose và Domain
class BoatLogMapper {
    // Phương thức tĩnh chuyển đổi từ Mongoose Document thành thực thể giàu nghiệp vụ Domain BoatLog
    static toDomain(mongooseDoc) {
        // Ép kiểu các phần tử ID người dùng thích bài viết từ ObjectId/String thành String thuần túy
        const likes = (mongooseDoc.likes || []).map((id) => 
        // Nếu là đối tượng chứa ID thì toString(), ngược lại chuyển đổi trực tiếp phần tử thô
        id._id ? id._id.toString() : id.toString());
        // Khởi tạo và trả về đối tượng thực thể miền Domain BoatLog mới
        return new BoatLog_1.BoatLog({
            // Chuyển đổi mã người viết từ ObjectId của Mongoose thành dạng chuỗi string
            userId: mongooseDoc.userId.toString(),
            // Gán tên hiển thị của người viết
            userName: mongooseDoc.userName,
            // Gán ảnh đại diện của người viết
            userAvatar: mongooseDoc.userAvatar,
            // Gán nội dung văn bản nhật ký
            content: mongooseDoc.content,
            // Gán danh sách ảnh đính kèm (mặc định mảng rỗng nếu trường trống)
            images: mongooseDoc.images || [],
            // Gán danh sách ID những người thích bài viết
            likes,
            batchId: mongooseDoc.batchId?.toString(),
            boatName: mongooseDoc.boatName,
            catchArea: mongooseDoc.catchArea,
            landingTime: mongooseDoc.landingTime,
            origin: mongooseDoc.origin,
        }, 
        // Gán mã định danh duy nhất của MongoDB Document thành mã ID thực thể dạng string
        mongooseDoc._id.toString());
    }
    // Phương thức tĩnh chuyển đổi từ thực thể Domain BoatLog thành đối tượng thô lưu xuống MongoDB
    static toPersistence(domainEntity) {
        // Trích xuất các thuộc tính dữ liệu thô từ thực thể miền
        const props = domainEntity.toProps();
        // Trả về cấu trúc JSON tương thích hoàn toàn với schema của Mongoose model
        return {
            // Ép kiểu userId dạng chuỗi thành mongoose.Types.ObjectId để lưu đúng định dạng quan hệ DB
            userId: new mongoose_1.default.Types.ObjectId(props.userId),
            // Gán tên người viết
            userName: props.userName,
            // Gán ảnh đại diện người viết
            userAvatar: props.userAvatar,
            // Gán nội dung bài đăng
            content: props.content,
            // Gán danh sách ảnh đính kèm
            images: props.images,
            // Ép kiểu tất cả ID người thích trong mảng likes từ chuỗi thành Mongoose ObjectId
            likes: props.likes.map((id) => new mongoose_1.default.Types.ObjectId(id)),
            batchId: props.batchId
                ? new mongoose_1.default.Types.ObjectId(props.batchId)
                : undefined,
            boatName: props.boatName,
            catchArea: props.catchArea,
            landingTime: props.landingTime,
            origin: props.origin,
        };
    }
}
exports.BoatLogMapper = BoatLogMapper;

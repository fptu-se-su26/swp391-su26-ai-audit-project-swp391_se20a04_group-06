"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
// Import thực thể User của tầng Domain
const User_1 = require("../../../../domain/entities/User");
// Import thư viện Mongoose
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * LỚP MAPPING DỮ LIỆU USER (UserMapper)
 * Chịu trách nhiệm chuyển đổi cấu trúc dữ liệu qua lại giữa tầng Nghiệp vụ (Domain Entity) và tầng Cơ sở dữ liệu (Persistence Object)
 */
class UserMapper {
    /**
     * CHUYỂN ĐỔI TỪ MONGOOSE DOCUMENT SANG DOMAIN ENTITY (toDomain)
     * Ánh xạ thông tin lưu trữ trong MongoDB thành một thực thể nghiệp vụ User có đầy đủ các phương thức logic
     */
    static toDomain(mongooseDoc) {
        return new User_1.User({
            name: mongooseDoc.name,
            email: mongooseDoc.email,
            passwordHash: mongooseDoc.passwordHash,
            role: mongooseDoc.role,
            isActive: mongooseDoc.isActive,
            isVerified: mongooseDoc.isVerified,
            isPremium: !!mongooseDoc.isPremium, // Đảm bảo ép kiểu boolean rõ ràng
            avatar: mongooseDoc.avatar,
            badges: mongooseDoc.badges || [],
            // Chuyển đổi mảng các ObjectId trong DB thành mảng các chuỗi string ID ở tầng Domain để độc lập với DB loại nào
            favorites: (mongooseDoc.favorites || []).map((id) => id.toString()),
            following: (mongooseDoc.following || []).map((id) => id.toString()),
        }, mongooseDoc._id.toString() // Gán ID thô từ MongoDB làm ID định danh của thực thể Domain
        );
    }
    /**
     * CHUYỂN ĐỔI TỪ DOMAIN ENTITY SANG PERSISTENCE OBJECT (toPersistence)
     * Ánh xạ thực thể nghiệp vụ thành một đối tượng dữ liệu trơn để lưu vào cơ sở dữ liệu MongoDB
     */
    static toPersistence(domainEntity) {
        // Lấy các thuộc tính hiện tại của thực thể miền
        const props = domainEntity.toProps();
        return {
            name: props.name,
            email: props.email,
            passwordHash: props.passwordHash,
            role: props.role,
            isActive: props.isActive,
            isVerified: props.isVerified,
            avatar: props.avatar,
            isPremium: props.isPremium,
            badges: props.badges,
            // Chuyển đổi ngược mảng ID dạng chuỗi (string) thành kiểu ObjectId của Mongoose trước khi ghi vào MongoDB
            favorites: props.favorites.map((id) => new mongoose_1.default.Types.ObjectId(id)),
            following: props.following.map((id) => new mongoose_1.default.Types.ObjectId(id)),
        };
    }
}
exports.UserMapper = UserMapper;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeMapper = void 0;
const Recipe_1 = require("../../../../domain/entities/Recipe");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Lớp RecipeMapper dùng để chuyển đổi dữ liệu qua lại giữa Mongoose Document và Domain Entity.
 * Đảm bảo lõi nghiệp vụ (Domain) không bị phụ thuộc vào cấu trúc schema của Database (Mongoose).
 * Rất quan trọng khi làm việc nhóm vì nó tách biệt ranh giới giữa DB và Logic nghiệp vụ.
 */
class RecipeMapper {
    /**
     * Ánh xạ từ Mongoose Document lấy từ DB sang Domain Entity giàu nghiệp vụ.
     */
    static toDomain(mongooseDoc) {
        // Xử lý an toàn trường hợp authorId được populate thành object hoặc chỉ giữ ObjectId thô
        const authorId = mongooseDoc.authorId && mongooseDoc.authorId._id
            ? mongooseDoc.authorId._id.toString()
            : mongooseDoc.authorId.toString();
        // Chuyển đổi mảng likes từ ObjectId thành chuỗi string
        const likes = (mongooseDoc.likes || []).map((id) => id._id ? id._id.toString() : id.toString());
        return new Recipe_1.Recipe({
            title: mongooseDoc.title,
            description: mongooseDoc.description,
            ingredients: mongooseDoc.ingredients || [],
            instructions: mongooseDoc.instructions || [],
            imageUrl: mongooseDoc.imageUrl,
            authorId,
            difficulty: mongooseDoc.difficulty,
            cookingTime: mongooseDoc.cookingTime,
            servings: mongooseDoc.servings,
            tags: mongooseDoc.tags || [],
            likes,
            viewCount: mongooseDoc.viewCount || 0,
        }, mongooseDoc._id.toString());
    }
    /**
     * Ánh xạ từ Domain Entity sang Object thô để lưu trữ vào Mongoose Database.
     */
    static toPersistence(domainEntity) {
        const props = domainEntity.toProps();
        return {
            title: props.title,
            description: props.description,
            ingredients: props.ingredients,
            instructions: props.instructions,
            imageUrl: props.imageUrl,
            authorId: new mongoose_1.default.Types.ObjectId(props.authorId),
            difficulty: props.difficulty,
            cookingTime: props.cookingTime,
            servings: props.servings,
            tags: props.tags,
            likes: props.likes.map((id) => new mongoose_1.default.Types.ObjectId(id)),
            viewCount: props.viewCount,
        };
    }
}
exports.RecipeMapper = RecipeMapper;

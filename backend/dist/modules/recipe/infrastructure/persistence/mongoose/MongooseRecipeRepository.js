"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseRecipeRepository = void 0;
// Import model Mongoose Recipe từ thư mục models để truy vấn dữ liệu MongoDB
const Recipe_1 = require("../../../../../models/Recipe");
// Import bộ chuyển đổi RecipeMapper để chuyển đổi qua lại giữa Domain Model và Database Document
const RecipeMapper_1 = require("./mappers/RecipeMapper");
// Import thư viện mongoose để thực hiện kiểm tra định dạng kiểu dữ liệu ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Adapter thực thi giao tiếp Database cho phân hệ Recipe.
 * Triển khai interface IRecipeRepository (Port) định nghĩa ở tầng Domain.
 * Đảm bảo các thành viên khác trong nhóm 4 người có thể dễ dàng hiểu cách dữ liệu được lưu trữ.
 */
class MongooseRecipeRepository {
    /**
     * Tìm kiếm công thức nấu ăn bằng ID.
     * Có populate thông tin cơ bản của tác giả để đảm bảo tính toàn vẹn thông tin.
     */
    async findById(id) {
        // Kiểm tra xem ID truyền vào có phải là một ObjectId hợp lệ trong MongoDB hay không
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return null;
        // Thực hiện truy vấn MongoDB để tìm tài liệu công thức theo ID và tự động nạp (populate) thông tin tác giả
        const doc = await Recipe_1.Recipe.findById(id).populate("authorId", "name avatar isVerified role");
        // Nếu không tìm thấy tài liệu công thức, trả về null
        if (!doc)
            return null;
        // Sử dụng RecipeMapper để chuyển đổi tài liệu DB vừa tìm được sang thực thể Domain Recipe
        return RecipeMapper_1.RecipeMapper.toDomain(doc);
    }
    /**
     * Lưu hoặc cập nhật công thức nấu ăn vào Database.
     * Hỗ trợ cập nhật (update) nếu Recipe đã có ID, ngược lại tạo mới (save).
     */
    async save(recipe) {
        // Chuyển đổi thực thể Domain Recipe sang dạng đối tượng thuần phù hợp để lưu trữ MongoDB
        const persistenceData = RecipeMapper_1.RecipeMapper.toPersistence(recipe);
        // Nếu công thức đã có ID và ID đó là một ObjectId hợp lệ trong MongoDB
        if (recipe.id && mongoose_1.default.Types.ObjectId.isValid(recipe.id)) {
            // Thực hiện cập nhật tài liệu công thức trong DB, nếu chưa có thì chèn mới (upsert)
            await Recipe_1.Recipe.findByIdAndUpdate(recipe.id, { $set: persistenceData }, { upsert: true, new: true });
        }
        else {
            // Trường hợp tạo mới công thức nấu ăn hoàn toàn
            const doc = new Recipe_1.Recipe(persistenceData);
            // Thực hiện lưu tài liệu mới vào cơ sở dữ liệu MongoDB
            await doc.save();
            // Gán lại mã ID tự sinh từ MongoDB vào thực thể Domain Recipe
            recipe._id = doc._id.toString();
        }
    }
    /**
     * Xóa công thức nấu ăn khỏi cơ sở dữ liệu.
     */
    async delete(recipe) {
        // Nếu công thức có ID và ID đó là một ObjectId hợp lệ trong MongoDB
        if (recipe.id && mongoose_1.default.Types.ObjectId.isValid(recipe.id)) {
            // Tiến hành xóa tài liệu công thức khỏi MongoDB
            await Recipe_1.Recipe.findByIdAndDelete(recipe.id);
        }
    }
}
exports.MongooseRecipeRepository = MongooseRecipeRepository;

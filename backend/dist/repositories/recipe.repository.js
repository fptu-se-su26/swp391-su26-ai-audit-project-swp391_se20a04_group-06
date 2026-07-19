"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeRepository = void 0;
// Import mô hình Recipe của Mongoose để thực hiện các câu lệnh truy vấn cơ sở dữ liệu MongoDB
const Recipe_1 = require("../models/Recipe");
// Import lớp MongooseRecipeRepository trong module recipe ở lớp hạ tầng để thực hiện lưu trữ/xóa thực thể
const MongooseRecipeRepository_1 = require("../modules/recipe/infrastructure/persistence/mongoose/MongooseRecipeRepository");
// Import thực thể miền Recipe (Domain Entity) để khởi tạo và áp dụng quy tắc nghiệp vụ
const Recipe_2 = require("../modules/recipe/domain/entities/Recipe");
const mongoose_1 = __importDefault(require("mongoose"));
// Khởi tạo đối tượng Repository DDD quản lý thực thể miền Công thức nấu ăn
const dddRecipeRepository = new MongooseRecipeRepository_1.MongooseRecipeRepository();
/**
 * Repository cho Recipe hoạt động như một lớp Chống Tham Nhũng (Anti-Corruption Layer - ACL).
 * Giữ nguyên các hàm đọc (Query) trực tiếp từ Mongoose để đảm bảo hiệu năng tối ưu cho đội ngũ 4 người.
 * Ủy quyền các hàm ghi (Write/Command) cho DDD Aggregate Root để thực thi đúng logic nghiệp vụ.
 */
exports.recipeRepository = {
    // ── READ OPERATIONS (Truy vấn tối ưu hóa) ──────────────────────────────────
    // Phương thức tìm kiếm tất cả công thức nấu ăn dựa theo bộ lọc, phân trang, và tùy chọn sắp xếp điểm số
    async findAll(filter, skip, limit, sortByScore = false) {
        // Xác định cấu hình sắp xếp: nếu sắp xếp theo điểm số tìm kiếm văn bản thì ưu tiên điểm số, ngược lại xếp theo thời gian tạo giảm dần
        const sortOption = sortByScore
            ? { score: { $meta: "textScore" }, createdAt: -1 }
            : { createdAt: -1 };
        // Xác định trường chiếu (projection) để lấy điểm số tìm kiếm nếu có
        const projection = sortByScore
            ? { score: { $meta: "textScore" } }
            : {};
        // Thực hiện truy vấn đồng thời danh sách công thức nấu ăn và đếm số lượng tài liệu khớp bộ lọc
        const [recipes, total] = await Promise.all([
            // Tìm các công thức nấu ăn phù hợp với bộ lọc và trường hiển thị
            Recipe_1.Recipe.find(filter, projection)
                // Liên kết thông tin người tác giả (authorId) để lấy các trường: tên, ảnh đại diện, đã xác thực và vai trò
                .populate("authorId", "name avatar isVerified role")
                // Sắp xếp danh sách
                .sort(sortOption)
                // Bỏ qua skip phần tử để phân trang
                .skip(skip)
                // Giới hạn số lượng phần tử trả về trên một trang
                .limit(limit),
            // Đếm số lượng công thức nấu ăn thỏa mãn bộ lọc
            Recipe_1.Recipe.countDocuments(filter),
        ]);
        // Trả về danh sách công thức nấu ăn và tổng số lượng tìm thấy
        return { recipes, total };
    },
    // Phương thức tìm kiếm công thức nấu ăn theo ID
    async findById(id) {
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id))
            return null;
        // Tìm kiếm công thức nấu ăn và liên kết thông tin của tác giả
        return Recipe_1.Recipe.findById(id).populate("authorId", "name avatar isVerified role");
    },
    // Phương thức tìm kiếm công thức nấu ăn theo ID và tăng số lượng lượt xem lên 1
    async findByIdAndIncrementView(id) {
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id))
            return null;
        // Tìm kiếm theo ID và tăng biến viewCount thêm 1 đơn vị, trả về dữ liệu mới sau khi tăng
        return Recipe_1.Recipe.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true }).populate("authorId", "name avatar isVerified role"); // Liên kết thông tin tác giả
    },
    // Phương thức đếm số lượng công thức nấu ăn thỏa mãn bộ lọc
    async countDocuments(filter) {
        // Gọi hàm countDocuments của Mongoose model để đếm số bản ghi
        return Recipe_1.Recipe.countDocuments(filter);
    },
    // ── WRITE OPERATIONS (Ủy quyền cho DDD Aggregate & Repository) ──────────────
    // Phương thức tạo mới một công thức nấu ăn
    async create(data) {
        // Khởi tạo một thực thể miền Domain Recipe với các giá trị đầu vào ban đầu
        const domainRecipe = new Recipe_2.Recipe({
            title: data.title,
            description: data.description,
            ingredients: data.ingredients,
            instructions: data.instructions,
            imageUrl: data.imageUrl,
            authorId: data.authorId,
            difficulty: data.difficulty,
            cookingTime: data.cookingTime,
            servings: data.servings,
            tags: data.tags,
            likes: [], // Khởi tạo danh sách lượt thích trống
            viewCount: 0, // Khởi tạo số lượng lượt xem bằng 0
        });
        // Gọi DDD repository để thực hiện kiểm chứng và lưu trữ thực thể miền này
        await dddRecipeRepository.save(domainRecipe);
        // Lấy lại tài liệu Mongoose thô từ database bằng ID thực thể miền để trả về cho API cũ
        return (await Recipe_1.Recipe.findById(domainRecipe.id));
    },
    // Phương thức cập nhật thông tin công thức nấu ăn
    async update(
    // ID của công thức cần cập nhật
    id, 
    // Các trường thông tin cho phép cập nhật một phần
    updates) {
        // Tìm thực thể miền Recipe trong DDD repository bằng ID
        const domainRecipe = await dddRecipeRepository.findById(id);
        // Nếu không tìm thấy thực thể tương ứng, trả về null
        if (!domainRecipe)
            return null;
        // Thực hiện hàm nghiệp vụ cập nhật thông tin của thực thể miền
        domainRecipe.update(updates);
        // Lưu lại trạng thái cập nhật của thực thể miền xuống database thông qua DDD repository
        await dddRecipeRepository.save(domainRecipe);
        // Trả về tài liệu Mongoose thô sau khi đã lưu thành công
        return Recipe_1.Recipe.findById(id);
    },
    // Phương thức thêm lượt thích của một người dùng cho công thức nấu ăn
    async addLike(recipeId, userId) {
        // Tìm kiếm thực thể miền Recipe trong DDD repository
        const domainRecipe = await dddRecipeRepository.findById(recipeId);
        // Nếu không tìm thấy công thức nấu ăn tương ứng, trả về null
        if (!domainRecipe)
            return null;
        // Nếu người dùng này chưa từng thích công thức nấu ăn này
        if (!domainRecipe.likes.includes(userId)) {
            // Thực hiện nghiệp vụ bật/tắt lượt thích (thêm userId vào danh sách likes)
            domainRecipe.toggleLike(userId);
            // Lưu thực thể miền xuống database thông qua DDD repository
            await dddRecipeRepository.save(domainRecipe);
        }
        // Trả về tài liệu Mongoose thô đã cập nhật
        return Recipe_1.Recipe.findById(recipeId);
    },
    // Phương thức xóa lượt thích của một người dùng khỏi công thức nấu ăn
    async removeLike(recipeId, userId) {
        // Tìm kiếm thực thể miền Recipe trong DDD repository
        const domainRecipe = await dddRecipeRepository.findById(recipeId);
        // Nếu không tìm thấy công thức nấu ăn tương ứng, trả về null
        if (!domainRecipe)
            return null;
        // Nếu người dùng này đã thích công thức nấu ăn này trước đó
        if (domainRecipe.likes.includes(userId)) {
            // Thực hiện nghiệp vụ bật/tắt lượt thích (xóa userId khỏi danh sách likes)
            domainRecipe.toggleLike(userId);
            // Lưu thực thể miền xuống database thông qua DDD repository
            await dddRecipeRepository.save(domainRecipe);
        }
        // Trả về tài liệu Mongoose thô đã cập nhật
        return Recipe_1.Recipe.findById(recipeId);
    },
    // Phương thức cập nhật đồng loạt nhiều tài liệu công thức nấu ăn khớp với bộ lọc
    async updateMany(filter, update, options = {}) {
        // Thực hiện cập nhật hàng loạt bằng phương thức của Mongoose Model
        return Recipe_1.Recipe.updateMany(filter, update, options);
    },
    // Phương thức xóa đồng loạt nhiều tài liệu công thức nấu ăn khớp với bộ lọc
    async deleteMany(filter) {
        // Thực hiện xóa hàng loạt bằng phương thức của Mongoose Model
        return Recipe_1.Recipe.deleteMany(filter);
    },
    // Phương thức xóa một công thức nấu ăn theo ID
    async delete(id) {
        // Tìm thực thể miền Recipe trong DDD repository bằng ID
        const domainRecipe = await dddRecipeRepository.findById(id);
        // Nếu tìm thấy thực thể miền tương ứng
        if (domainRecipe) {
            // Gọi DDD repository để thực hiện nghiệp vụ xóa thực thể miền khỏi database
            await dddRecipeRepository.delete(domainRecipe);
        }
        // Trả về kết quả xóa thành công
        return true;
    },
};

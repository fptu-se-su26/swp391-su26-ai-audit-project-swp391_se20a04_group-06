"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoosePostRepository = void 0;
// Import model Mongoose Post từ thư mục models để truy vấn dữ liệu MongoDB
const Post_1 = require("../../../../../models/Post");
// Import bộ chuyển đổi PostMapper để chuyển đổi qua lại giữa Domain Model và Database Document
const PostMapper_1 = require("./mappers/PostMapper");
// Import thư viện mongoose để thực hiện kiểm tra định dạng kiểu dữ liệu ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Adapter thực thi lưu trữ bài đăng (Post) và bình luận (Comment) thông qua Mongoose.
 */
class MongoosePostRepository {
    /**
     * Tìm kiếm bài đăng theo ID.
     */
    async findById(id) {
        // Kiểm tra xem ID truyền vào có phải là một ObjectId hợp lệ trong MongoDB hay không
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return null;
        // Thực hiện truy vấn MongoDB để tìm tài liệu bài viết theo ID
        const doc = await Post_1.Post.findById(id);
        // Nếu không tìm thấy tài liệu bài viết, trả về null
        if (!doc)
            return null;
        // Sử dụng PostMapper để chuyển đổi tài liệu DB vừa tìm được sang thực thể Domain Post
        return PostMapper_1.PostMapper.toDomain(doc);
    }
    /**
     * Lưu hoặc cập nhật trạng thái bài đăng.
     */
    async save(post) {
        // Chuyển đổi thực thể Domain Post sang dạng đối tượng thuần phù hợp để lưu trữ MongoDB
        const persistenceData = PostMapper_1.PostMapper.toPersistence(post);
        // Nếu bài đăng đã có ID hợp lệ trong MongoDB
        if (post.id && mongoose_1.default.Types.ObjectId.isValid(post.id)) {
            // Cập nhật tài liệu bài viết hiện có trong DB, nếu chưa có thì tự sinh mới (upsert)
            const doc = await Post_1.Post.findByIdAndUpdate(post.id, { $set: persistenceData }, { upsert: true, new: true });
            // Nếu việc cập nhật thành công và trả về tài liệu mới nhất
            if (doc) {
                // Ánh xạ tài liệu mới cập nhật ngược lại về Domain để đồng bộ mảng bình luận (chứa ID được MongoDB tự sinh)
                const updated = PostMapper_1.PostMapper.toDomain(doc);
                post.props.comments = updated.comments;
            }
        }
        else {
            // Trường hợp tạo mới bài viết hoàn toàn
            const doc = new Post_1.Post(persistenceData);
            // Thực hiện lưu tài liệu mới vào cơ sở dữ liệu MongoDB
            await doc.save();
            // Gán lại mã ID tự sinh từ MongoDB vào thực thể Domain Post
            post._id = doc._id.toString();
            // Ánh xạ ngược từ document vừa lưu để đồng bộ danh sách bình luận (nếu có)
            const updated = PostMapper_1.PostMapper.toDomain(doc);
            post.props.comments = updated.comments;
        }
    }
    /**
     * Xóa bài đăng.
     */
    async delete(post) {
        // Nếu bài đăng có ID và ID đó là một ObjectId hợp lệ trong MongoDB
        if (post.id && mongoose_1.default.Types.ObjectId.isValid(post.id)) {
            // Tiến hành xóa tài liệu bài đăng khỏi MongoDB
            await Post_1.Post.findByIdAndDelete(post.id);
        }
    }
}
exports.MongoosePostRepository = MongoosePostRepository;

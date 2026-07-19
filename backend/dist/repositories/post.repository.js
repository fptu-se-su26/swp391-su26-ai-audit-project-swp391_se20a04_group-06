"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRepository = void 0;
// Import thư viện mongoose để thực hiện kiểm tra kiểu dữ liệu ObjectId của MongoDB
const mongoose_1 = __importDefault(require("mongoose"));
// Import mô hình Mongoose Post để truy vấn trực tiếp cơ sở dữ liệu MongoDB
const Post_1 = require("../models/Post");
// Import lớp MongoosePostRepository ở tầng hạ tầng của DDD để thực thi các nghiệp vụ lưu/xóa thực thể
const MongoosePostRepository_1 = require("../modules/post/infrastructure/persistence/mongoose/MongoosePostRepository");
// Import thực thể miền Domain Post để khởi tạo đối tượng nghiệp vụ khi ghi dữ liệu
const Post_2 = require("../modules/post/domain/entities/Post");
// Khởi tạo đối tượng Repository DDD quản lý lưu trữ thực thể miền Bài viết diễn đàn
const dddPostRepository = new MongoosePostRepository_1.MongoosePostRepository();
// Xuất đối tượng postRepository đóng vai trò lớp Chống Tham Nhũng (Anti-Corruption Layer) trung gian
exports.postRepository = {
    // ── READ OPERATIONS (Tác vụ Đọc - Tối ưu hóa truy vấn nhanh qua Mongoose thô) ─────────────────────────
    // Lấy danh sách các bài viết dựa trên bộ lọc lọc, phân trang và hỗ trợ sắp xếp theo điểm liên quan
    async findAll(filter, skip, limit, sortByScore = false) {
        // Nếu có cờ sortByScore = true (sắp xếp tìm kiếm text), sắp xếp theo điểm textScore của MongoDB, ngược lại xếp theo ngày tạo giảm dần
        const sortOption = sortByScore
            ? { score: { $meta: "textScore" }, createdAt: -1 }
            : { createdAt: -1 };
        // Nếu sắp xếp theo score, cần bổ sung trường score chiếu xạ (projection) điểm textScore để MongoDB tính toán
        const projection = sortByScore
            ? { score: { $meta: "textScore" } }
            : {};
        // Thực thi song song câu lệnh tìm kiếm danh sách bài viết và đếm tổng số bản ghi khớp bộ lọc
        const [posts, total] = await Promise.all([
            // Tìm bài viết theo bộ lọc và chiếu xạ điểm, sắp xếp, skip dòng phân trang và giới hạn dòng
            Post_1.Post.find(filter, projection).sort(sortOption).skip(skip).limit(limit),
            // Đếm số lượng tài liệu khớp bộ lọc
            Post_1.Post.countDocuments(filter),
        ]);
        // Trả về đối tượng chứa danh sách bài viết và tổng số lượng
        return { posts, total };
    },
    // Tìm kiếm bài viết theo ID
    async findById(id) {
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id))
            return null;
        // Gọi phương thức findById của Mongoose model để tìm kiếm tài liệu
        return Post_1.Post.findById(id);
    },
    // Tìm kiếm bài viết theo ID và đồng thời tự động tăng chỉ số lượt xem (viewCount) thêm 1 đơn vị
    async findByIdAndIncrementView(id) {
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id))
            return null;
        // Tìm kiếm và cập nhật tài liệu
        return Post_1.Post.findByIdAndUpdate(id, 
        // Tăng trường viewCount thêm 1
        { $inc: { viewCount: 1 } }, 
        // Trả về đối tượng mới sau khi đã cập nhật
        { new: true });
    },
    // Đếm tổng số lượng bài viết khớp bộ lọc điều kiện
    async countDocuments(filter) {
        // Gọi phương thức countDocuments của Mongoose model
        return Post_1.Post.countDocuments(filter);
    },
    // ── WRITE OPERATIONS (Tác vụ Ghi - Bắt buộc phải qua Domain Entity & Domain Repo) ────────────────────
    // Tạo mới một bài viết diễn đàn
    async create(data) {
        // Khởi tạo một thực thể miền Domain Post mới đảm bảo các ràng buộc bất biến
        const domainPost = new Post_2.Post({
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            title: data.title,
            content: data.content,
            images: data.images,
            tags: data.tags,
            likes: [], // Khởi tạo mảng thích rỗng
            comments: [], // Khởi tạo mảng bình luận rỗng
            viewCount: 0, // Đặt lượt xem ban đầu bằng 0
        });
        // Gọi repository DDD thực hiện validate nghiệp vụ và lưu thực thể bài viết mới vào DB
        await dddPostRepository.save(domainPost);
        // Tìm lại tài liệu Mongoose thô từ database để trả về đồng bộ dữ liệu
        return (await Post_1.Post.findById(domainPost.id));
    },
    // Thêm lượt thích của người dùng vào bài viết
    async addLike(postId, userId) {
        // Truy xuất thực thể Domain Post thông qua DDD repository
        const domainPost = await dddPostRepository.findById(postId);
        // Nếu không tồn tại thực thể miền, trả về null
        if (!domainPost)
            return null;
        // Nếu người dùng này chưa từng thích bài đăng
        if (!domainPost.likes.includes(userId)) {
            // Thực thi nghiệp vụ thích bài viết (toggleLike)
            domainPost.toggleLike(userId);
            // Đồng bộ và lưu thực thể xuống DB
            await dddPostRepository.save(domainPost);
        }
        // Trả về tài liệu Mongoose thô cập nhật mới nhất
        return Post_1.Post.findById(postId);
    },
    // Xóa lượt thích của người dùng khỏi bài viết
    async removeLike(postId, userId) {
        // Truy xuất thực thể Domain Post thông qua DDD repository
        const domainPost = await dddPostRepository.findById(postId);
        // Nếu không tồn tại thực thể miền, trả về null
        if (!domainPost)
            return null;
        // Nếu người dùng này đã thích bài viết trước đó
        if (domainPost.likes.includes(userId)) {
            // Thực thi nghiệp vụ hủy thích bài viết (toggleLike)
            domainPost.toggleLike(userId);
            // Lưu lại thay đổi xuống DB
            await dddPostRepository.save(domainPost);
        }
        // Trả về tài liệu Mongoose thô cập nhật
        return Post_1.Post.findById(postId);
    },
    // Thêm bình luận mới vào bài viết
    async addComment(
    // ID bài viết cần bình luận
    postId, 
    // Đối tượng thông tin bình luận mới
    comment) {
        // Lấy thực thể Domain Post thông qua DDD repository
        const domainPost = await dddPostRepository.findById(postId);
        // Nếu không tồn tại bài viết, trả về null
        if (!domainPost)
            return null;
        // Ủy quyền nghiệp vụ thêm bình luận cho phương thức addComment của Domain Entity
        domainPost.addComment(comment.userId, comment.userName, comment.userAvatar, comment.text);
        // Đồng bộ và lưu thực thể đã có bình luận mới xuống DB
        await dddPostRepository.save(domainPost);
        // Trả về tài liệu Mongoose thô chứa bình luận mới (bao gồm cả ID bình luận do MongoDB tự tạo)
        return Post_1.Post.findById(postId);
    },
    // Xóa bỏ một bình luận khỏi bài viết
    async deleteComment(postId, commentId) {
        // Lấy thực thể Domain Post qua DDD repository
        const domainPost = await dddPostRepository.findById(postId);
        // Nếu không tìm thấy bài viết, trả về null
        if (!domainPost)
            return null;
        // Tìm kiếm bình luận mục tiêu cần xóa trong thực thể miền
        const comment = domainPost.comments.find((c) => c.id === commentId);
        // Nếu tìm thấy bình luận tương ứng
        if (comment) {
            // Gọi phương thức nghiệp vụ removeComment. Truyền vai trò "Admin" để bỏ qua check phân quyền
            // của người xóa ở tầng này (tầng Controller thực tế đã check quyền trước rồi)
            domainPost.removeComment(commentId, comment.userId, "Admin");
            // Lưu thực thể miền đã cập nhật mảng bình luận xuống DB
            await dddPostRepository.save(domainPost);
        }
        // Trả về tài liệu Mongoose thô đã cập nhật
        return Post_1.Post.findById(postId);
    },
    // Cập nhật hàng loạt tài liệu bài viết khớp bộ lọc (phục vụ đồng bộ thông tin tác giả/bình luận)
    async updateMany(filter, update, options = {}) {
        // Gọi phương thức updateMany của Mongoose model để cập nhật hàng loạt tài liệu bài viết
        return Post_1.Post.updateMany(filter, update, options);
    },
    // Xóa hàng loạt tài liệu bài viết khớp bộ lọc (phục vụ xóa tài khoản người dùng)
    async deleteMany(filter) {
        // Gọi phương thức deleteMany của Mongoose model để xóa hàng loạt bài viết
        return Post_1.Post.deleteMany(filter);
    },
    // Xóa một bài viết theo ID
    async delete(id) {
        // Lấy thực thể Domain Post qua DDD repository
        const domainPost = await dddPostRepository.findById(id);
        // Nếu thực thể bài viết tồn tại trong hệ thống
        if (domainPost) {
            // Gọi repository DDD thực thi xóa bỏ vĩnh viễn thực thể này khỏi cơ sở dữ liệu
            await dddPostRepository.delete(domainPost);
        }
        // Trả về true biểu thị tác vụ xóa hoàn tất thành công
        return true;
    },
};

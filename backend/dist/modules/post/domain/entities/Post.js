"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
// Import thư viện crypto mặc định của Node.js để sinh mã UUID ngẫu nhiên
const crypto_1 = __importDefault(require("crypto"));
// Import lớp cha AggregateRoot để quản lý thực thể Aggregate Root trong kiến trúc miền Domain
const AggregateRoot_1 = require("../../../../shared/domain/AggregateRoot");
// Import ngoại lệ ValidationError dùng để báo lỗi xác thực dữ liệu đầu vào
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Định nghĩa thực thể Aggregate Root đại diện cho Post trong miền nghiệp vụ (Domain)
class Post extends AggregateRoot_1.AggregateRoot {
    // Hàm khởi tạo nhận vào các thuộc tính props và mã định danh id bài viết (nếu có)
    constructor(props, id) {
        // Gọi hàm khởi tạo của lớp cha AggregateRoot
        super(props, id);
        // Thực hiện kiểm định dữ liệu bài viết ngay khi đối tượng được tạo
        this.validate();
    }
    // Phương thức xác thực tính hợp lệ của dữ liệu bài viết
    validate() {
        // Kiểm tra tiêu đề có bị bỏ trống hoặc chỉ chứa khoảng trắng hay không
        if (!this.props.title || this.props.title.trim() === "") {
            // Ném lỗi xác thực nếu tiêu đề rỗng
            throw new DomainException_1.ValidationError("Tiêu đề bài viết không được trống.");
        }
        // Kiểm tra nội dung bài viết có bị bỏ trống hoặc chỉ chứa khoảng trắng hay không
        if (!this.props.content || this.props.content.trim() === "") {
            // Ném lỗi xác thực nếu nội dung rỗng
            throw new DomainException_1.ValidationError("Nội dung bài viết không được trống.");
        }
    }
    // Nghiệp vụ bật/tắt yêu thích bài viết (Like/Unlike) của một người dùng
    toggleLike(userId) {
        // Tìm kiếm vị trí ID người dùng trong danh sách likes
        const index = this.props.likes.indexOf(userId);
        // Nếu người dùng chưa từng thích bài viết này
        if (index === -1) {
            // Thêm ID người dùng vào danh sách thích
            this.props.likes.push(userId);
            // Trả về true biểu thị hành động Thích bài đăng thành công
            return true;
        }
        else {
            // Nếu đã thích rồi thì xóa ID người dùng ra khỏi danh sách thích
            this.props.likes.splice(index, 1);
            // Trả về false biểu thị hành động Hủy thích bài đăng thành công
            return false;
        }
    }
    // Nghiệp vụ thêm bình luận mới vào bài viết
    addComment(userId, userName, userAvatar, text, parentId) {
        // Kiểm tra xem nội dung bình luận có bị bỏ trống hay không
        if (!text || text.trim() === "") {
            // Ném lỗi nếu nội dung bình luận trống
            throw new DomainException_1.ValidationError("Nội dung bình luận không được trống.");
        }
        // Đẩy bình luận mới vào cuối mảng bình luận của bài viết
        this.props.comments.push({
            // Sinh mã ID ngẫu nhiên cho bình luận bằng crypto.randomUUID
            id: crypto_1.default.randomUUID(),
            // Gán mã người bình luận
            userId,
            // Gán tên hiển thị của người bình luận
            userName,
            // Gán ảnh đại diện của người bình luận
            userAvatar,
            // Gán nội dung bình luận đã được làm sạch khoảng trắng
            text: text.trim(),
            // Gán ID bình luận cha nếu có
            parentId,
            // Khởi tạo mảng thích bình luận rỗng
            likes: [],
            // Gán thời điểm tạo bình luận là thời gian hiện tại
            createdAt: new Date(),
        });
    }
    // Nghiệp vụ thích/bỏ thích bình luận của người dùng
    toggleCommentLike(commentId, userId) {
        const comment = this.props.comments.find((c) => c.id === commentId);
        if (!comment) {
            throw new DomainException_1.ValidationError("Không tìm thấy bình luận.");
        }
        if (!comment.likes) {
            comment.likes = [];
        }
        const index = comment.likes.indexOf(userId);
        if (index === -1) {
            comment.likes.push(userId);
            return true;
        }
        else {
            comment.likes.splice(index, 1);
            return false;
        }
    }
    // Nghiệp vụ xóa bình luận khỏi bài viết
    removeComment(commentId, userId, role) {
        // Tìm vị trí bình luận cần xóa trong mảng dựa vào ID bình luận
        const index = this.props.comments.findIndex((c) => c.id === commentId);
        // Nếu không tìm thấy bình luận tương ứng
        if (index === -1) {
            // Ném lỗi xác thực báo không tìm thấy bình luận
            throw new DomainException_1.ValidationError("Không tìm thấy bình luận.");
        }
        // Lấy ra thông tin bình luận tại vị trí tìm thấy
        const comment = this.props.comments[index];
        // Kiểm tra phân quyền: Nếu không phải Admin, không phải người bình luận, và cũng không phải chủ bài viết
        if (role !== "Admin" && comment.userId !== userId && this.props.userId !== userId) {
            // Ném lỗi từ chối hành động xóa bình luận
            throw new DomainException_1.ValidationError("Bạn không có quyền xóa bình luận này.");
        }
        // Xóa bình luận khỏi mảng
        this.props.comments.splice(index, 1);
    }
    // Chuyển đổi thực thể Domain Post thành đối tượng thuần Plain Object kèm ID
    toProps() {
        // Trả về đối tượng chứa tất cả thông tin dữ liệu của bài viết
        return {
            // Mã ID của bài viết
            id: this.id,
            // ID người viết bài
            userId: this.props.userId,
            // Tên hiển thị người viết bài
            userName: this.props.userName,
            // Ảnh đại diện của người viết bài
            userAvatar: this.props.userAvatar,
            // Tiêu đề bài viết
            title: this.props.title,
            // Nội dung bài viết
            content: this.props.content,
            // Mảng ảnh đính kèm
            images: this.props.images,
            // Mảng thẻ từ khóa
            tags: this.props.tags,
            // Mảng lượt thích
            likes: this.props.likes,
            // Mảng bình luận
            comments: this.props.comments,
            // Số lượt xem
            viewCount: this.props.viewCount,
            // Ngày tạo bài viết
            createdAt: this.props.createdAt,
        };
    }
    // Getter truy xuất nhanh ID người viết bài
    get userId() { return this.props.userId; }
    // Getter truy xuất danh sách lượt thích
    get likes() { return this.props.likes; }
    // Getter truy xuất danh sách các bình luận
    get comments() { return this.props.comments; }
}
exports.Post = Post;

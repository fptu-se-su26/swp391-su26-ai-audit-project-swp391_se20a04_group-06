"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import thực thể Domain Post cần thực hiện kiểm thử đơn vị
const Post_1 = require("../../../../../../../backend/src/modules/post/domain/entities/Post");
// Bắt đầu nhóm kiểm thử đơn vị cho thực thể Post Domain Entity
describe("Unit Test: Post Domain Entity", () => {
    // Định nghĩa các thuộc tính mặc định (defaultProps) hợp lệ để tái sử dụng trong các ca kiểm thử
    const defaultProps = {
        // ID của người viết bài
        userId: "user-1",
        // Tên hiển thị người viết bài
        userName: "Tàu cá 01",
        // Ảnh đại diện mặc định là null
        userAvatar: null,
        // Tiêu đề bài viết hợp lệ
        title: "Kinh nghiệm tránh bão",
        // Nội dung bài viết hợp lệ
        content: "Nội dung chia sẻ kinh nghiệm tránh bão...",
        // Không đính kèm ảnh
        images: [],
        // Các nhãn từ khóa phân loại
        tags: ["bão", "ngư-nghiệp"],
        // Mảng ID người thích ban đầu rỗng
        likes: [],
        // Mảng bình luận ban đầu rỗng
        comments: [],
        // Lượt xem ban đầu bằng 0
        viewCount: 0,
    };
    // Ca test 1: Đảm bảo ném ra lỗi ValidationError nếu tiêu đề bài đăng bị trống
    it("nên ném ra lỗi nếu tiêu đề bài viết trống", () => {
        // Mong đợi ném lỗi khi khởi tạo thực thể với tiêu đề rỗng
        expect(() => {
            // Khởi tạo thực thể Post mới
            new Post_1.Post({
                // Kế thừa các thuộc tính mặc định hợp lệ
                ...defaultProps,
                // Ghi đè tiêu đề bằng chuỗi rỗng
                title: "",
            });
            // Mong đợi lỗiValidationError ném ra khớp đúng câu thông báo bất biến miền
        }).toThrow("Tiêu đề bài viết không được trống.");
    });
    // Ca test 2: Đảm bảo ném ra lỗi ValidationError nếu nội dung bài đăng bị trống
    it("nên ném ra lỗi nếu nội dung bài viết trống", () => {
        // Mong đợi ném lỗi khi khởi tạo thực thể với nội dung chỉ chứa khoảng trắng
        expect(() => {
            // Khởi tạo thực thể Post mới
            new Post_1.Post({
                // Kế thừa các thuộc tính mặc định hợp lệ
                ...defaultProps,
                // Ghi đè nội dung bằng chuỗi khoảng trắng
                content: "   ",
            });
            // Mong đợi lỗi ValidationError ném ra khớp đúng câu thông báo bất biến miền
        }).toThrow("Nội dung bài viết không được trống.");
    });
    // Ca test 3: Đảm bảo logic thích/bỏ thích (Like/Unlike) bài viết hoạt động chính xác
    it("nên thay đổi trạng thái thích chính xác", () => {
        // Khởi tạo thực thể Post với dữ liệu mặc định hợp lệ
        const post = new Post_1.Post(defaultProps);
        // Bấm thích lần đầu tiên bằng ID người dùng "user-2"
        const liked = post.toggleLike("user-2");
        // Mong đợi kết quả trả về của toggleLike phải là true (đã thích thành công)
        expect(liked).toBe(true);
        // Danh sách likes phải chứa ID "user-2"
        expect(post.likes).toContain("user-2");
        // Bấm thích lần thứ hai bằng cùng ID người dùng "user-2" (hủy thích)
        const unliked = post.toggleLike("user-2");
        // Mong đợi kết quả trả về của toggleLike lúc này phải là false (đã hủy thích thành công)
        expect(unliked).toBe(false);
        // Danh sách likes không còn chứa ID "user-2" nữa
        expect(post.likes).not.toContain("user-2");
    });
    // Ca test 4: Đảm bảo nghiệp vụ thêm bình luận hoạt động đúng và tự động chặn bình luận trống
    it("nên thêm bình luận hợp lệ và từ chối bình luận trống", () => {
        // Khởi tạo thực thể bài viết mới
        const post = new Post_1.Post(defaultProps);
        // Thực hiện hành động thêm một bình luận hợp lệ từ "user-2"
        post.addComment("user-2", "Bạn cá", null, "Bài viết rất hay!");
        // Mong đợi tổng số bình luận của bài viết tăng lên 1
        expect(post.comments.length).toBe(1);
        // Mong đợi nội dung văn bản bình luận trùng khớp
        expect(post.comments[0].text).toBe("Bài viết rất hay!");
        // Mong đợi ném lỗi khi cố tình bình luận bằng chuỗi trống ""
        expect(() => {
            // Gọi phương thức addComment với nội dung trống
            post.addComment("user-2", "Bạn cá", null, "");
            // Mong đợi lỗi ném ra khớp câu thông điệp
        }).toThrow("Nội dung bình luận không được trống.");
    });
    // Ca test 5: Kiểm tra phân quyền nghiệp vụ xóa bình luận (Chính chủ, tác giả bài đăng, hoặc Admin)
    it("nên xóa bình luận của chính mình, của tác giả bài viết hoặc Admin, và từ chối người khác", () => {
        // Khởi tạo một thực thể bài viết có sẵn 1 bình luận của "user-commenter"
        const post = new Post_1.Post({
            // Lấy các thuộc tính mặc định
            ...defaultProps,
            // Gán mảng bình luận chứa 1 comment mẫu
            comments: [
                {
                    // Mã ID của bình luận
                    id: "comment-1",
                    // ID người tạo bình luận
                    userId: "user-commenter",
                    // Tên hiển thị người bình luận
                    userName: "Người bình luận",
                    // Không có avatar
                    userAvatar: null,
                    // Nội dung bình luận mẫu
                    text: "Bình luận dạo",
                    // Thời gian tạo
                    createdAt: new Date(),
                },
            ],
        });
        // 1. Kịch bản người lạ (user-stranger) cố tình xóa bình luận của người khác
        expect(() => {
            // Thực thi xóa bình luận "comment-1" với tư cách người lạ
            post.removeComment("comment-1", "user-stranger", "User");
            // Mong đợi ném lỗi ValidationError do không đủ thẩm quyền
        }).toThrow("Bạn không có quyền xóa bình luận này.");
        // 2. Kịch bản chính tác giả của bình luận ("user-commenter") tự xóa bình luận của mình
        post.removeComment("comment-1", "user-commenter", "User");
        // Mong đợi bình luận được xóa sạch khỏi mảng comments
        expect(post.comments.length).toBe(0);
        // 3. Kịch bản tác giả của bài viết ("user-1") xóa bình luận của người khác ("user-commenter")
        post.addComment("user-commenter", "Người bình luận", null, "Bình luận mới");
        // Lấy ID bình luận mới được tự động sinh ra trong mảng
        const newCommentId = post.comments[0].id || "";
        // post.userId = "user-1" (defaultProps), ta dùng "user-1" để xóa comment của "user-commenter"
        post.removeComment(newCommentId, "user-1", "User");
        // Mong đợi bình luận mới được xóa thành công khỏi mảng comments
        expect(post.comments.length).toBe(0);
        // 4. Kịch bản quản trị viên (role: Admin) xóa bình luận của bất kỳ ai
        post.addComment("user-commenter", "Người bình luận", null, "Bình luận 3");
        // Lấy ID của bình luận thứ 3 mới đăng
        const comment3Id = post.comments[0].id || "";
        // Thực thi xóa bình luận với vai trò "Admin"
        post.removeComment(comment3Id, "user-admin", "Admin");
        // Mong đợi bình luận được Admin xóa bỏ thành công khỏi mảng comments
        expect(post.comments.length).toBe(0);
    });
});

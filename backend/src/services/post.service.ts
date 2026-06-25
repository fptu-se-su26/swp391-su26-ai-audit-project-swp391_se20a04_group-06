// Import đối tượng postRepository để xử lý truy vấn và cập nhật bài viết diễn đàn
import { postRepository } from "../repositories/post.repository";
// Import đối tượng userRepository để truy vấn thông tin tài khoản người viết bài/bình luận
import { userRepository } from "../repositories/user.repository";
// Import hàm updateUserBadges để tự động tính toán lại danh hiệu người dùng sau khi hoạt động
import { updateUserBadges } from "./badge.service";
// Import lớp lỗi HttpError phục vụ ném lỗi kèm mã trạng thái HTTP
import { HttpError } from "../errors/HttpError";
// Import hàm helper parseId để kiểm định định dạng ObjectId
import { parseId } from "../helpers/response.helper";

// Xuất đối tượng postService chứa logic nghiệp vụ quản lý bài viết diễn đàn
export const postService = {
  // Nghiệp vụ lấy danh sách bài viết có bộ lọc, từ khóa tìm kiếm và phân trang
  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    userId?: string;
  }) {
    // Chuyển trang hiện tại sang kiểu số nguyên, mặc định là 1
    const page = parseInt(query.page || "1", 10);
    // Chuyển giới hạn số dòng sang kiểu số nguyên, mặc định là 10
    const limit = parseInt(query.limit || "10", 10);
    // Tính khoảng offset bỏ qua
    const skip = (page - 1) * limit;

    // Khởi tạo bộ lọc rỗng
    const filter: any = {};
    // Nếu có từ khóa tìm kiếm
    if (query.search) {
      // Áp dụng tìm kiếm văn bản toàn văn (text search) dựa trên chỉ mục index của MongoDB
      filter.$text = { $search: query.search };
    }
    // Nếu có truyền ID người dùng và là ID hợp lệ, lọc bài viết theo tác giả
    if (query.userId && parseId(query.userId)) {
      filter.userId = query.userId;
    }

    // Xác định kiểu sắp xếp: nếu có tìm kiếm thì ưu tiên theo điểm số tương đồng (sortByScore = true)
    const sortByScore = !!query.search;
    // Gọi repository để truy vấn danh sách bài đăng và tổng số lượng khớp bộ lọc
    const { posts, total } = await postRepository.findAll(
      filter,
      skip,
      limit,
      sortByScore,
    );

    // Trả về dữ liệu kết quả kèm thông tin phân trang
    return {
      posts,
      page,
      limit,
      total,
      // Tính tổng số trang bằng cách chia trần
      totalPages: Math.ceil(total / limit),
    };
  },

  // Lấy chi tiết bài đăng theo ID bài viết và tăng số lượt xem lên 1
  async getById(id: string) {
    // Gọi repository cập nhật tăng view và lấy dữ liệu
    const post = await postRepository.findByIdAndIncrementView(id);
    // Nếu không tồn tại bài viết tương ứng, ném lỗi 404
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");
    // Trả về chi tiết bài đăng
    return post;
  },

  // Tạo mới một bài viết chia sẻ trên cộng đồng diễn đàn
  async create(
    userId: string, // ID tác giả đăng bài
    data: {
      title: string; // Tiêu đề bài đăng
      content: string; // Nội dung bài đăng
      images?: string[]; // Danh sách hình ảnh đính kèm
      tags?: string[]; // Danh sách thẻ hashtag phân loại
    },
  ) {
    // Tìm tài liệu người dùng thô trong database
    const user = await userRepository.findRawById(userId);
    // Nếu không tồn tại người dùng, ném lỗi 404
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    // Gọi repository lưu bài viết mới vào DB
    const post = await postRepository.create({
      userId,
      userName: user.name, // Đồng bộ tên hiển thị của tác giả
      userAvatar: user.avatar || null, // Đồng bộ ảnh đại diện của tác giả
      title: data.title,
      content: data.content,
      images: data.images || [], // Danh sách ảnh đính kèm (mặc định mảng trống)
      tags: data.tags || [], // Danh sách thẻ hashtag (mặc định mảng trống)
    });

    // Chạy tác vụ nền cập nhật huy hiệu cho người dùng này và nuốt lỗi nếu xảy ra sự cố không để ảnh hưởng API đăng bài
    updateUserBadges(userId).catch(() => {});
    // Trả về bài đăng mới tạo
    return post;
  },

  // Nghiệp vụ bật hoặc tắt trạng thái thích (like/unlike) bài đăng diễn đàn
  async toggleLike(postId: string, userId: string) {
    // Tìm thông tin bài viết theo ID
    const post = await postRepository.findById(postId);
    // Nếu không tìm thấy bài đăng tương ứng, ném lỗi 404
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");

    // Tra cứu vị trí ID người dùng trong mảng likes của bài đăng
    const index = post.likes.indexOf(userId as any);
    let liked = false;
    let updatedPost;

    // Nếu người dùng chưa từng thích bài đăng này trước đó
    if (index === -1) {
      // Gọi repository thêm lượt thích
      updatedPost = await postRepository.addLike(postId, userId);
      liked = true; // Thiết lập trạng thái đã thích
    } else {
      // Ngược lại, gọi repository để hủy thích
      updatedPost = await postRepository.removeLike(postId, userId);
    }

    // Trả về trạng thái đã thích hay chưa cùng tổng lượt thích hiện tại của bài đăng
    return { liked, likeCount: updatedPost?.likes.length || 0 };
  },

  // Nghiệp vụ thêm bình luận (comment) mới vào dưới bài đăng
  async addComment(postId: string, userId: string, text: string) {
    // Tìm thông tin bài đăng
    const post = await postRepository.findById(postId);
    // Nếu không tồn tại bài đăng tương ứng, ném lỗi 404
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");

    // Tìm thông tin người bình luận
    const user = await userRepository.findRawById(userId);
    // Nếu không tồn tại người dùng, ném lỗi 404
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    // Gọi repository để thêm đối tượng comment mới vào DB
    const updatedPost = await postRepository.addComment(postId, {
      userId,
      userName: user.name, // Đồng bộ tên hiển thị
      userAvatar: user.avatar || null, // Đồng bộ ảnh đại diện
      text: text.trim(), // Cắt bỏ khoảng trắng thừa hai đầu bình luận
    });

    // Trả về danh sách bình luận đã được cập nhật mới nhất (hoặc mảng rỗng nếu lỗi)
    return updatedPost?.comments || [];
  },

  // Nghiệp vụ xóa bài đăng diễn đàn
  async delete(postId: string, userId: string, role: string) {
    // Tìm kiếm bài đăng theo ID
    const post = await postRepository.findById(postId);
    // Nếu không tồn tại bài đăng tương ứng, ném lỗi 404
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");

    // Chặn quyền: Chỉ cho phép tài khoản Admin HOẶC chủ nhân của bài viết được phép xóa
    if (role !== "Admin" && post.userId.toString() !== userId) {
      throw new HttpError(403, "Bạn không có quyền xóa bài đăng này");
    }

    // Gọi repository thực hiện xóa bài đăng khỏi cơ sở dữ liệu
    await postRepository.delete(postId);
  },

  // Nghiệp vụ xóa một bình luận của bài đăng
  async deleteComment(
    postId: string, // ID bài viết chứa bình luận
    commentId: string, // ID bình luận cần xóa
    userId: string, // ID người yêu cầu xóa
    role: string, // Vai trò người dùng yêu cầu xóa
  ) {
    // Tìm kiếm bài đăng theo ID
    const post = await postRepository.findById(postId);
    // Nếu không tồn tại bài viết tương ứng, ném lỗi 404
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");

    // Tìm kiếm bình luận trong mảng comments của bài viết
    const comment = post.comments.find(
      (c) => (c as any)._id.toString() === commentId,
    );
    // Nếu không tồn tại bình luận tương ứng, ném lỗi 404
    if (!comment) throw new HttpError(404, "Không tìm thấy bình luận");

    // Chặn quyền: Chỉ cho phép Admin, tác giả của bình luận, HOẶC tác giả của bài viết được phép xóa
    if (
      role !== "Admin" &&
      comment.userId.toString() !== userId &&
      post.userId.toString() !== userId
    ) {
      throw new HttpError(403, "Bạn không có quyền xóa bình luận này");
    }

    // Gọi repository thực hiện gỡ bình luận ra khỏi mảng comments
    const updatedPost = await postRepository.deleteComment(postId, commentId);
    // Trả về danh sách bình luận sau khi xóa để cập nhật giao diện
    return updatedPost?.comments || [];
  },
};

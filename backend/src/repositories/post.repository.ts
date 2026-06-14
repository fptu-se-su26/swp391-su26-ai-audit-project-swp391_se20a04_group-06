// Import thư viện mongoose để thực hiện kiểm tra kiểu dữ liệu ObjectId của MongoDB
import mongoose from "mongoose";
// Import mô hình Mongoose Post để truy vấn trực tiếp cơ sở dữ liệu MongoDB
import { Post as MongoosePost } from "../models/Post";
// Import lớp MongoosePostRepository ở tầng hạ tầng của DDD để thực thi các nghiệp vụ lưu/xóa thực thể
import { MongoosePostRepository } from "../modules/post/infrastructure/persistence/mongoose/MongoosePostRepository";
// Import thực thể miền Domain Post để khởi tạo đối tượng nghiệp vụ khi ghi dữ liệu
import { Post as DomainPost } from "../modules/post/domain/entities/Post";

// Khởi tạo đối tượng Repository DDD quản lý lưu trữ thực thể miền Bài viết diễn đàn
const dddPostRepository = new MongoosePostRepository();

// Xuất đối tượng postRepository đóng vai trò lớp Chống Tham Nhũng (Anti-Corruption Layer) trung gian
export const postRepository = {
  // ── READ OPERATIONS (Tác vụ Đọc - Tối ưu hóa truy vấn nhanh qua Mongoose thô) ─────────────────────────

  // Lấy danh sách các bài viết dựa trên bộ lọc lọc, phân trang và hỗ trợ sắp xếp theo điểm liên quan
  async findAll(filter: any, skip: number, limit: number, sortByScore = false) {
    // Nếu có cờ sortByScore = true (sắp xếp tìm kiếm text), sắp xếp theo điểm textScore của MongoDB, ngược lại xếp theo ngày tạo giảm dần
    const sortOption: any = sortByScore
      ? { score: { $meta: "textScore" }, createdAt: -1 }
      : { createdAt: -1 };
    // Nếu sắp xếp theo score, cần bổ sung trường score chiếu xạ (projection) điểm textScore để MongoDB tính toán
    const projection: any = sortByScore
      ? { score: { $meta: "textScore" } }
      : {};

    // Thực thi song song câu lệnh tìm kiếm danh sách bài viết và đếm tổng số bản ghi khớp bộ lọc
    const [posts, total] = await Promise.all([
      // Tìm bài viết theo bộ lọc và chiếu xạ điểm, sắp xếp, skip dòng phân trang và giới hạn dòng
      MongoosePost.find(filter, projection).sort(sortOption).skip(skip).limit(limit),
      // Đếm số lượng tài liệu khớp bộ lọc
      MongoosePost.countDocuments(filter),
    ]);
    // Trả về đối tượng chứa danh sách bài viết và tổng số lượng
    return { posts, total };
  },

  // Tìm kiếm bài viết theo ID
  async findById(id: string) {
    // Gọi phương thức findById của Mongoose model để tìm kiếm tài liệu
    return MongoosePost.findById(id);
  },

  // Tìm kiếm bài viết theo ID và đồng thời tự động tăng chỉ số lượt xem (viewCount) thêm 1 đơn vị
  async findByIdAndIncrementView(id: string) {
    // Tìm kiếm và cập nhật tài liệu
    return MongoosePost.findByIdAndUpdate(
      id,
      // Tăng trường viewCount thêm 1
      { $inc: { viewCount: 1 } },
      // Trả về đối tượng mới sau khi đã cập nhật
      { new: true },
    );
  },

  // Đếm tổng số lượng bài viết khớp bộ lọc điều kiện
  async countDocuments(filter: any): Promise<number> {
    // Gọi phương thức countDocuments của Mongoose model
    return MongoosePost.countDocuments(filter);
  },

  // ── WRITE OPERATIONS (Tác vụ Ghi - Bắt buộc phải qua Domain Entity & Domain Repo) ────────────────────

  // Tạo mới một bài viết diễn đàn
  async create(data: {
    // ID người viết bài
    userId: string;
    // Tên hiển thị người viết
    userName: string;
    // Ảnh đại diện người viết
    userAvatar: string | null;
    // Tiêu đề bài đăng
    title: string;
    // Nội dung bài viết
    content: string;
    // Mảng ảnh đính kèm
    images: string[];
    // Mảng thẻ tags phân loại
    tags: string[];
  }) {
    // Khởi tạo một thực thể miền Domain Post mới đảm bảo các ràng buộc bất biến
    const domainPost = new DomainPost({
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
    return (await MongoosePost.findById(domainPost.id))!;
  },

  // Thêm lượt thích của người dùng vào bài viết
  async addLike(postId: string, userId: string) {
    // Truy xuất thực thể Domain Post thông qua DDD repository
    const domainPost = await dddPostRepository.findById(postId);
    // Nếu không tồn tại thực thể miền, trả về null
    if (!domainPost) return null;

    // Nếu người dùng này chưa từng thích bài đăng
    if (!domainPost.likes.includes(userId)) {
      // Thực thi nghiệp vụ thích bài viết (toggleLike)
      domainPost.toggleLike(userId);
      // Đồng bộ và lưu thực thể xuống DB
      await dddPostRepository.save(domainPost);
    }
    // Trả về tài liệu Mongoose thô cập nhật mới nhất
    return MongoosePost.findById(postId);
  },

  // Xóa lượt thích của người dùng khỏi bài viết
  async removeLike(postId: string, userId: string) {
    // Truy xuất thực thể Domain Post thông qua DDD repository
    const domainPost = await dddPostRepository.findById(postId);
    // Nếu không tồn tại thực thể miền, trả về null
    if (!domainPost) return null;

    // Nếu người dùng này đã thích bài viết trước đó
    if (domainPost.likes.includes(userId)) {
      // Thực thi nghiệp vụ hủy thích bài viết (toggleLike)
      domainPost.toggleLike(userId);
      // Lưu lại thay đổi xuống DB
      await dddPostRepository.save(domainPost);
    }
    // Trả về tài liệu Mongoose thô cập nhật
    return MongoosePost.findById(postId);
  },

  // Thêm bình luận mới vào bài viết
  async addComment(
    // ID bài viết cần bình luận
    postId: string,
    // Đối tượng thông tin bình luận mới
    comment: {
      userId: string;
      userName: string;
      userAvatar: string | null;
      text: string;
    },
  ) {
    // Lấy thực thể Domain Post thông qua DDD repository
    const domainPost = await dddPostRepository.findById(postId);
    // Nếu không tồn tại bài viết, trả về null
    if (!domainPost) return null;

    // Ủy quyền nghiệp vụ thêm bình luận cho phương thức addComment của Domain Entity
    domainPost.addComment(comment.userId, comment.userName, comment.userAvatar, comment.text);
    // Đồng bộ và lưu thực thể đã có bình luận mới xuống DB
    await dddPostRepository.save(domainPost);

    // Trả về tài liệu Mongoose thô chứa bình luận mới (bao gồm cả ID bình luận do MongoDB tự tạo)
    return MongoosePost.findById(postId);
  },

  // Xóa bỏ một bình luận khỏi bài viết
  async deleteComment(postId: string, commentId: string) {
    // Lấy thực thể Domain Post qua DDD repository
    const domainPost = await dddPostRepository.findById(postId);
    // Nếu không tìm thấy bài viết, trả về null
    if (!domainPost) return null;

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
    return MongoosePost.findById(postId);
  },

  // Cập nhật hàng loạt tài liệu bài viết khớp bộ lọc (phục vụ đồng bộ thông tin tác giả/bình luận)
  async updateMany(filter: any, update: any, options: any = {}) {
    // Gọi phương thức updateMany của Mongoose model để cập nhật hàng loạt tài liệu bài viết
    return MongoosePost.updateMany(filter, update, options);
  },

  // Xóa hàng loạt tài liệu bài viết khớp bộ lọc (phục vụ xóa tài khoản người dùng)
  async deleteMany(filter: any) {
    // Gọi phương thức deleteMany của Mongoose model để xóa hàng loạt bài viết
    return MongoosePost.deleteMany(filter);
  },

  // Xóa một bài viết theo ID
  async delete(id: string) {
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

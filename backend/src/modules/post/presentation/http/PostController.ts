// Import các đối tượng Request, Response, NextFunction từ Express để xử lý HTTP request/response và middleware
import { Request, Response, NextFunction } from "express";
// Import hàm parseId từ helper để định dạng và xác thực mã định danh truyền lên
import { parseId } from "../../../../helpers/response.helper";
// Import đối tượng postService quản lý các tác vụ truy vấn đọc dữ liệu bài viết
import { postService } from "../../../../services/post.service";

// DDD Components
// Import lớp MongoosePostRepository để tương tác trực tiếp với cơ sở dữ liệu MongoDB
import { MongoosePostRepository } from "../../infrastructure/persistence/mongoose/MongoosePostRepository";
// Import lớp CreatePostUseCase để thực hiện nghiệp vụ tạo mới bài đăng
import { CreatePostUseCase } from "../../application/use-cases/CreatePostUseCase";
// Import lớp DeletePostUseCase để thực hiện nghiệp vụ xóa bài đăng
import { DeletePostUseCase } from "../../application/use-cases/DeletePostUseCase";
// Import lớp ToggleLikePostUseCase để thực hiện nghiệp vụ thích hoặc bỏ thích bài đăng
import { ToggleLikePostUseCase } from "../../application/use-cases/ToggleLikePostUseCase";
// Import lớp AddCommentUseCase để thực hiện nghiệp vụ thêm bình luận
import { AddCommentUseCase } from "../../application/use-cases/AddCommentUseCase";
// Import lớp DeleteCommentUseCase để thực hiện nghiệp vụ xóa bình luận
import { DeleteCommentUseCase } from "../../application/use-cases/DeleteCommentUseCase";
import { ToggleLikeCommentUseCase } from "../../application/use-cases/ToggleLikeCommentUseCase";

// Khởi tạo đối tượng Repository dùng chung cho các Use Cases
const postRepository = new MongoosePostRepository();
// Khởi tạo Use Case tạo mới bài viết, tiêm Repository vào qua Constructor
const createPostUseCase = new CreatePostUseCase(postRepository);
// Khởi tạo Use Case xóa bài viết, tiêm Repository vào qua Constructor
const deletePostUseCase = new DeletePostUseCase(postRepository);
// Khởi tạo Use Case thích/bỏ thích bài viết, tiêm Repository vào qua Constructor
const toggleLikePostUseCase = new ToggleLikePostUseCase(postRepository);
// Khởi tạo Use Case thêm bình luận, tiêm Repository vào qua Constructor
const addCommentUseCase = new AddCommentUseCase(postRepository);
// Khởi tạo Use Case xóa bình luận, tiêm Repository vào qua Constructor
const deleteCommentUseCase = new DeleteCommentUseCase(postRepository);
// Khởi tạo Use Case thích/bỏ thích bình luận, tiêm Repository vào qua Constructor
const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase(postRepository);

// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────

/**
 * Lấy danh sách các bài đăng (hỗ trợ phân trang, tìm kiếm, lọc theo userId).
 */
export async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    // Gọi postService thực hiện tìm kiếm và lọc danh sách bài viết theo query string
    const result = await postService.list(req.query as any);
    // Trả về kết quả JSON cho Client
    return res.json(result);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

/**
 * Lấy chi tiết một bài đăng theo ID (và tự động tăng view count).
 */
export async function getPostById(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID bài viết từ URL params
  const id = parseId(req.params.id);
  // Nếu ID bài đăng không hợp lệ, trả về mã trạng thái 400 kèm thông điệp báo lỗi
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    // Gọi postService lấy thông tin chi tiết bài đăng và tự động tăng lượt xem
    const post = await postService.getById(id);
    // Trả về dữ liệu bài viết dạng JSON
    return res.json(post);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────

/**
 * Đăng bài viết mới trên diễn đàn.
 */
export async function createPost(req: Request, res: Response, next: NextFunction) {
  // Trích xuất mã ID người dùng đăng bài từ token đã xác thực
  const { userId } = req.user;
  try {
    // Thực thi Use Case tạo bài đăng mới với ID người đăng và dữ liệu gửi lên
    const post = await createPostUseCase.execute(userId, req.body);
    // Phản hồi mã trạng thái 201 (Created) kèm thông báo thành công và thuộc tính bài viết dạng thuần
    return res.status(201).json({
      message: "Đăng bài thành công",
      post: post.toProps(),
    });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

/**
 * Thích hoặc bỏ thích một bài đăng.
 */
export async function toggleLikePost(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID bài đăng từ URL params
  const id = parseId(req.params.id);
  // Trích xuất ID người dùng thích bài viết từ token
  const { userId } = req.user;
  // Nếu ID bài đăng không hợp lệ, phản hồi lỗi 400
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    // Thực thi Use Case thích/bỏ thích bài viết
    const result = await toggleLikePostUseCase.execute(id, userId);
    // Trả về kết quả JSON (trạng thái liked và số lượt thích hiện tại)
    return res.json(result);
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

/**
 * Thêm bình luận vào bài viết.
 */
export async function addComment(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID bài đăng từ URL params
  const id = parseId(req.params.id);
  // Trích xuất ID người bình luận từ token
  const { userId } = req.user;
  // Lấy nội dung bình luận từ body của request
  const { text, parentId } = req.body;

  // Nếu ID bài đăng không hợp lệ, phản hồi lỗi 400
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    // Thực thi Use Case thêm bình luận
    const comments = await addCommentUseCase.execute(id, userId, text, parentId);
    // Trả về thông báo thành công kèm danh sách bình luận mới cập nhật
    return res.json({
      message: "Bình luận thành công",
      comments,
    });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

/**
 * Xóa một bài đăng.
 */
export async function deletePost(req: Request, res: Response, next: NextFunction) {
  // Trích xuất và định dạng ID bài viết cần xóa từ URL params
  const id = parseId(req.params.id);
  // Trích xuất ID người dùng và vai trò yêu cầu xóa từ token
  const { userId, role } = req.user;
  // Nếu ID không hợp lệ, phản hồi lỗi 400
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    // Thực thi Use Case xóa bài viết
    await deletePostUseCase.execute(id, userId, role);
    // Trả về thông điệp phản hồi xóa thành công
    return res.json({ message: "Xóa bài đăng thành công" });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

/**
 * Xóa bình luận khỏi bài viết.
 */
export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  // Trích xuất mã ID bài viết và ID bình luận cần xóa từ tham số truyền trên URL
  const { postId, commentId } = req.params;
  // Trích xuất ID người dùng và vai trò yêu cầu xóa từ token
  const { userId, role } = req.user;
  // Định dạng lại ID bài viết
  const parsedPostId = parseId(postId);

  // Nếu ID bài viết không hợp lệ, trả về lỗi 400
  if (!parsedPostId) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    // Thực thi Use Case xóa bình luận tương ứng
    const comments = await deleteCommentUseCase.execute(parsedPostId, commentId, userId, role);
    // Trả về phản hồi thành công kèm danh sách bình luận đã cập nhật mới
    return res.json({
      message: "Xóa bình luận thành công",
      comments,
    });
  } catch (err) {
    // Chuyển tiếp lỗi phát sinh
    next(err);
  }
}

/**
 * Cập nhật thông tin bài đăng.
 */
export async function updatePost(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const post = await postRepository.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    if (role !== "Admin" && post.userId !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bài đăng này" });
    }

    const { title, content, images, tags } = req.body;
    post.props.title = title || post.props.title;
    post.props.content = content || post.props.content;
    if (images !== undefined) post.props.images = images;
    if (tags !== undefined) post.props.tags = tags;

    await postRepository.save(post);

    return res.json({
      message: "Cập nhật bài đăng thành công",
      post: post.toProps(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Thích hoặc bỏ thích bình luận của bài đăng.
 */
export async function toggleLikeComment(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { commentId } = req.params;
  const { userId } = req.user;

  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const comments = await toggleLikeCommentUseCase.execute(id, commentId, userId);
    return res.json({
      message: "Thao tác thích bình luận thành công",
      comments,
    });
  } catch (err) {
    next(err);
  }
}


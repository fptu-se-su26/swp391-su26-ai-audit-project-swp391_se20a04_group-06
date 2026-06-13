import { Request, Response, NextFunction } from "express";
import { parseId } from "../../../../helpers/response.helper";
import { postService } from "../../../../services/post.service";

// DDD Components
import { MongoosePostRepository } from "../../infrastructure/persistence/mongoose/MongoosePostRepository";
import { CreatePostUseCase } from "../../application/use-cases/CreatePostUseCase";
import { DeletePostUseCase } from "../../application/use-cases/DeletePostUseCase";
import { ToggleLikePostUseCase } from "../../application/use-cases/ToggleLikePostUseCase";
import { AddCommentUseCase } from "../../application/use-cases/AddCommentUseCase";
import { DeleteCommentUseCase } from "../../application/use-cases/DeleteCommentUseCase";

const postRepository = new MongoosePostRepository();
const createPostUseCase = new CreatePostUseCase(postRepository);
const deletePostUseCase = new DeletePostUseCase(postRepository);
const toggleLikePostUseCase = new ToggleLikePostUseCase(postRepository);
const addCommentUseCase = new AddCommentUseCase(postRepository);
const deleteCommentUseCase = new DeleteCommentUseCase(postRepository);

// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────

/**
 * Lấy danh sách các bài đăng (hỗ trợ phân trang, tìm kiếm, lọc theo userId).
 */
export async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await postService.list(req.query as any);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Lấy chi tiết một bài đăng theo ID (và tự động tăng view count).
 */
export async function getPostById(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const post = await postService.getById(id);
    return res.json(post);
  } catch (err) {
    next(err);
  }
}

// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────

/**
 * Đăng bài viết mới trên diễn đàn.
 */
export async function createPost(req: Request, res: Response, next: NextFunction) {
  const { userId } = req.user;
  try {
    const post = await createPostUseCase.execute(userId, req.body);
    return res.status(201).json({
      message: "Đăng bài thành công",
      post: post.toProps(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Thích hoặc bỏ thích một bài đăng.
 */
export async function toggleLikePost(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId } = req.user;
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const result = await toggleLikePostUseCase.execute(id, userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Thêm bình luận vào bài viết.
 */
export async function addComment(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId } = req.user;
  const { text } = req.body;

  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const comments = await addCommentUseCase.execute(id, userId, text);
    return res.json({
      message: "Bình luận thành công",
      comments,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Xóa một bài đăng.
 */
export async function deletePost(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    await deletePostUseCase.execute(id, userId, role);
    return res.json({ message: "Xóa bài đăng thành công" });
  } catch (err) {
    next(err);
  }
}

/**
 * Xóa bình luận khỏi bài viết.
 */
export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  const { postId, commentId } = req.params;
  const { userId, role } = req.user;
  const parsedPostId = parseId(postId);

  if (!parsedPostId) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const comments = await deleteCommentUseCase.execute(parsedPostId, commentId, userId, role);
    return res.json({
      message: "Xóa bình luận thành công",
      comments,
    });
  } catch (err) {
    next(err);
  }
}

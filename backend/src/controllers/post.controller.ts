import { Request, Response } from "express";
import { postService } from "../services/post.service";
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getPosts(req: Request, res: Response) {
  try {
    const result = await postService.list(req.query as any);
    return res.json(result);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getPostById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const post = await postService.getById(id);
    return res.json(post);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function createPost(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const post = await postService.create(userId, req.body);
    return res.status(201).json({ message: "Đăng bài thành công", post });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function toggleLikePost(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { userId } = req.user;
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const result = await postService.toggleLike(id, userId);
    return res.json(result);
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function addComment(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { userId } = req.user;
  const { text } = req.body;

  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const comments = await postService.addComment(id, userId, text);
    return res.json({ message: "Bình luận thành công", comments });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function deletePost(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { userId, role } = req.user;
  if (!id) return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    await postService.delete(id, userId, role);
    return res.json({ message: "Xóa bài đăng thành công" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function deleteComment(req: Request, res: Response) {
  const { postId, commentId } = req.params;
  const { userId, role } = req.user;
  const parsedPostId = parseId(postId);

  if (!parsedPostId)
    return res.status(400).json({ message: "ID bài đăng không hợp lệ" });

  try {
    const comments = await postService.deleteComment(
      parsedPostId,
      commentId,
      userId,
      role,
    );
    return res.json({ message: "Xóa bình luận thành công", comments });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

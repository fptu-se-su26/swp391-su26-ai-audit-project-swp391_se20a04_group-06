import { Request, Response } from "express";
import mongoose from "mongoose";
import { Post } from "../models/Post";
import { User } from "../models/User";
import { sendServerError, parseId } from "../helpers/response.helper";
import { updateUserBadges } from "../services/badge.service";

export async function getPosts(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const userId = req.query.userId as string;

  try {
    const filter: any = {};
    if (search) {
      filter.$text = { $search: search };
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    const posts = await Post.find(filter)
      .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    return res.json({
      data: posts,
      posts,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getPostById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
  }

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    return res.json(post);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function createPost(req: Request, res: Response) {
  const { userId } = req.user;
  const { title, content, images, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Thiếu tiêu đề hoặc nội dung bài đăng" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const post = new Post({
      userId,
      userName: user.name,
      userAvatar: user.avatar || null,
      title,
      content,
      images: Array.isArray(images) ? images : [],
      tags: Array.isArray(tags) ? tags : [],
    });

    await post.save();
    updateUserBadges(userId).catch(() => {});
    return res.status(201).json({ message: "Đăng bài thành công", post });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function toggleLikePost(req: Request, res: Response) {
  const { userId } = req.user;
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const index = post.likes.indexOf(userId as any);
    let liked = false;
    if (index === -1) {
      post.likes.push(userId as any);
      liked = true;
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    return res.json({ liked, likeCount: post.likes.length });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function addComment(req: Request, res: Response) {
  const { userId } = req.user;
  const id = parseId(req.params.id);
  const { text } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
  }
  if (!text || text.trim() === "") {
    return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const comment = {
      userId: user._id as any,
      userName: user.name,
      userAvatar: user.avatar || null,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    return res.json({ message: "Bình luận thành công", comments: post.comments });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function deletePost(req: Request, res: Response) {
  const { userId, role } = req.user;
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    if (role !== "Admin" && post.userId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài đăng này" });
    }

    await post.deleteOne();
    return res.json({ message: "Xóa bài đăng thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function deleteComment(req: Request, res: Response) {
  const { userId, role } = req.user;
  const { postId, commentId } = req.params;

  const parsedPostId = parseId(postId);
  if (!parsedPostId) {
    return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
  }

  try {
    const post = await Post.findById(parsedPostId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const commentIndex = post.comments.findIndex(c => (c as any)._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    const comment = post.comments[commentIndex];

    // Auth: Comment author, post author, or admin can delete
    if (
      role !== "Admin" &&
      comment.userId.toString() !== userId &&
      post.userId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bình luận này" });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    return res.json({ message: "Xóa bình luận thành công", comments: post.comments });
  } catch (err) {
    return sendServerError(res, err);
  }
}

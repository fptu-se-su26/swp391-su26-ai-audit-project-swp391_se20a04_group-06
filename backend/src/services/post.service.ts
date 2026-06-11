import { postRepository } from "../repositories/post.repository";
import { userRepository } from "../repositories/user.repository";
import { updateUserBadges } from "./badge.service";
import { HttpError } from "../errors/HttpError";
import { parseId } from "../helpers/response.helper";

export const postService = {
  async list(query: {
    page?: string;
    limit?: string;
    search?: string;
    userId?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.userId && parseId(query.userId)) {
      filter.userId = query.userId;
    }

    const sortByScore = !!query.search;
    const { posts, total } = await postRepository.findAll(
      filter,
      skip,
      limit,
      sortByScore,
    );

    return {
      posts,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string) {
    const post = await postRepository.findByIdAndIncrementView(id);
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");
    return post;
  },

  async create(
    userId: string,
    data: {
      title: string;
      content: string;
      images?: string[];
      tags?: string[];
    },
  ) {
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const post = await postRepository.create({
      userId,
      userName: user.name,
      userAvatar: user.avatar || null,
      title: data.title,
      content: data.content,
      images: data.images || [],
      tags: data.tags || [],
    });

    updateUserBadges(userId).catch(() => {});
    return post;
  },

  async toggleLike(postId: string, userId: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");

    const index = post.likes.indexOf(userId as any);
    let liked = false;
    let updatedPost;

    if (index === -1) {
      updatedPost = await postRepository.addLike(postId, userId);
      liked = true;
    } else {
      updatedPost = await postRepository.removeLike(postId, userId);
    }

    return { liked, likeCount: updatedPost?.likes.length || 0 };
  },

  async addComment(postId: string, userId: string, text: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");

    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const updatedPost = await postRepository.addComment(postId, {
      userId,
      userName: user.name,
      userAvatar: user.avatar || null,
      text: text.trim(),
    });

    return updatedPost?.comments || [];
  },

  async delete(postId: string, userId: string, role: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");

    if (role !== "Admin" && post.userId.toString() !== userId) {
      throw new HttpError(403, "Bạn không có quyền xóa bài đăng này");
    }

    await postRepository.delete(postId);
  },

  async deleteComment(
    postId: string,
    commentId: string,
    userId: string,
    role: string,
  ) {
    const post = await postRepository.findById(postId);
    if (!post) throw new HttpError(404, "Không tìm thấy bài đăng");

    const comment = post.comments.find(
      (c) => (c as any)._id.toString() === commentId,
    );
    if (!comment) throw new HttpError(404, "Không tìm thấy bình luận");

    if (
      role !== "Admin" &&
      comment.userId.toString() !== userId &&
      post.userId.toString() !== userId
    ) {
      throw new HttpError(403, "Bạn không có quyền xóa bình luận này");
    }

    const updatedPost = await postRepository.deleteComment(postId, commentId);
    return updatedPost?.comments || [];
  },
};

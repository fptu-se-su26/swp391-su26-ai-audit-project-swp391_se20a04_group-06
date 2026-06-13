import mongoose from "mongoose";
import { Post as MongoosePost } from "../models/Post";
import { MongoosePostRepository } from "../modules/post/infrastructure/persistence/mongoose/MongoosePostRepository";
import { Post as DomainPost } from "../modules/post/domain/entities/Post";

const dddPostRepository = new MongoosePostRepository();

/**
 * Repository cho Post hoạt động như lớp Chống Tham Nhũng (Anti-Corruption Layer).
 * Tối ưu hóa các API đọc bằng cách truy vấn trực tiếp và ủy quyền các API ghi cho DDD Aggregates.
 */
export const postRepository = {
  // ── READ OPERATIONS ────────────────────────────────────────────────────────
  async findAll(filter: any, skip: number, limit: number, sortByScore = false) {
    const sortOption: any = sortByScore
      ? { score: { $meta: "textScore" }, createdAt: -1 }
      : { createdAt: -1 };
    const projection: any = sortByScore
      ? { score: { $meta: "textScore" } }
      : {};

    const [posts, total] = await Promise.all([
      MongoosePost.find(filter, projection).sort(sortOption).skip(skip).limit(limit),
      MongoosePost.countDocuments(filter),
    ]);
    return { posts, total };
  },

  async findById(id: string) {
    return MongoosePost.findById(id);
  },

  async findByIdAndIncrementView(id: string) {
    return MongoosePost.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    );
  },

  async countDocuments(filter: any): Promise<number> {
    return MongoosePost.countDocuments(filter);
  },

  // ── WRITE OPERATIONS ───────────────────────────────────────────────────────
  async create(data: {
    userId: string;
    userName: string;
    userAvatar: string | null;
    title: string;
    content: string;
    images: string[];
    tags: string[];
  }) {
    const domainPost = new DomainPost({
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      title: data.title,
      content: data.content,
      images: data.images,
      tags: data.tags,
      likes: [],
      comments: [],
      viewCount: 0,
    });

    await dddPostRepository.save(domainPost);
    return (await MongoosePost.findById(domainPost.id))!;
  },

  async addLike(postId: string, userId: string) {
    const domainPost = await dddPostRepository.findById(postId);
    if (!domainPost) return null;

    if (!domainPost.likes.includes(userId)) {
      domainPost.toggleLike(userId);
      await dddPostRepository.save(domainPost);
    }
    return MongoosePost.findById(postId);
  },

  async removeLike(postId: string, userId: string) {
    const domainPost = await dddPostRepository.findById(postId);
    if (!domainPost) return null;

    if (domainPost.likes.includes(userId)) {
      domainPost.toggleLike(userId);
      await dddPostRepository.save(domainPost);
    }
    return MongoosePost.findById(postId);
  },

  async addComment(
    postId: string,
    comment: {
      userId: string;
      userName: string;
      userAvatar: string | null;
      text: string;
    },
  ) {
    const domainPost = await dddPostRepository.findById(postId);
    if (!domainPost) return null;

    domainPost.addComment(comment.userId, comment.userName, comment.userAvatar, comment.text);
    await dddPostRepository.save(domainPost);

    return MongoosePost.findById(postId);
  },

  async deleteComment(postId: string, commentId: string) {
    const domainPost = await dddPostRepository.findById(postId);
    if (!domainPost) return null;

    // Lấy đại diện bất kỳ để bỏ qua check role khi xóa trực tiếp từ repository
    const comment = domainPost.comments.find((c) => c.id === commentId);
    if (comment) {
      domainPost.removeComment(commentId, comment.userId, "Admin");
      await dddPostRepository.save(domainPost);
    }

    return MongoosePost.findById(postId);
  },

  async updateMany(filter: any, update: any, options: any = {}) {
    return MongoosePost.updateMany(filter, update, options);
  },

  async deleteMany(filter: any) {
    return MongoosePost.deleteMany(filter);
  },

  async delete(id: string) {
    const domainPost = await dddPostRepository.findById(id);
    if (domainPost) {
      await dddPostRepository.delete(domainPost);
    }
    return true;
  },
};

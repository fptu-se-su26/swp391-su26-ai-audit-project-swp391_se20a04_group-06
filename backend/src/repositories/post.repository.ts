import mongoose from "mongoose";
import { Post } from "../models/Post";

export const postRepository = {
  async findAll(filter: any, skip: number, limit: number, sortByScore = false) {
    const sortOption: any = sortByScore
      ? { score: { $meta: "textScore" }, createdAt: -1 }
      : { createdAt: -1 };
    const projection: any = sortByScore
      ? { score: { $meta: "textScore" } }
      : {};

    const [posts, total] = await Promise.all([
      Post.find(filter, projection).sort(sortOption).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);
    return { posts, total };
  },

  async findById(id: string) {
    return Post.findById(id);
  },

  async findByIdAndIncrementView(id: string) {
    return Post.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    );
  },

  async create(data: {
    userId: string;
    userName: string;
    userAvatar: string | null;
    title: string;
    content: string;
    images: string[];
    tags: string[];
  }) {
    const post = new Post(data);
    await post.save();
    return post;
  },

  async countDocuments(filter: any): Promise<number> {
    return Post.countDocuments(filter);
  },

  async addLike(postId: string, userId: string) {
    return Post.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userId } },
      { new: true },
    );
  },

  async removeLike(postId: string, userId: string) {
    return Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId as any } },
      { new: true },
    );
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
    return Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            ...comment,
            userId: new mongoose.Types.ObjectId(comment.userId),
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    );
  },

  async deleteComment(postId: string, commentId: string) {
    return Post.findByIdAndUpdate(
      postId,
      {
        $pull: {
          comments: { _id: new mongoose.Types.ObjectId(commentId) },
        } as any,
      },
      { new: true },
    );
  },

  async updateMany(filter: any, update: any, options: any = {}) {
    return Post.updateMany(filter, update, options);
  },

  async deleteMany(filter: any) {
    return Post.deleteMany(filter);
  },

  async delete(id: string) {
    return Post.findByIdAndDelete(id);
  },
};

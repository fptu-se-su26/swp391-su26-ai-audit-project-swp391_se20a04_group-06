import { IPostRepository } from "../../../domain/repositories/IPostRepository";
import { Post as DomainPost } from "../../../domain/entities/Post";
import { Post as MongoosePost } from "../../../../../models/Post";
import { PostMapper } from "./mappers/PostMapper";
import mongoose from "mongoose";

/**
 * Adapter thực thi lưu trữ bài đăng (Post) và bình luận (Comment) thông qua Mongoose.
 */
export class MongoosePostRepository implements IPostRepository {
  /**
   * Tìm kiếm bài đăng theo ID.
   */
  async findById(id: string): Promise<DomainPost | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const doc = await MongoosePost.findById(id);
    if (!doc) return null;

    return PostMapper.toDomain(doc);
  }

  /**
   * Lưu hoặc cập nhật trạng thái bài đăng.
   */
  async save(post: DomainPost): Promise<void> {
    const persistenceData = PostMapper.toPersistence(post);

    if (post.id && mongoose.Types.ObjectId.isValid(post.id)) {
      const doc = await MongoosePost.findByIdAndUpdate(
        post.id,
        { $set: persistenceData },
        { upsert: true, new: true }
      );
      if (doc) {
        const updated = PostMapper.toDomain(doc);
        post.props.comments = updated.comments;
      }
    } else {
      const doc = new MongoosePost(persistenceData);
      await doc.save();
      (post as any)._id = doc._id.toString();
      const updated = PostMapper.toDomain(doc);
      post.props.comments = updated.comments;
    }
  }

  /**
   * Xóa bài đăng.
   */
  async delete(post: DomainPost): Promise<void> {
    if (post.id && mongoose.Types.ObjectId.isValid(post.id)) {
      await MongoosePost.findByIdAndDelete(post.id);
    }
  }
}

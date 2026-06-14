// Import interface IPostRepository để triển khai các thao tác dữ liệu bài đăng của tầng Domain
import { IPostRepository } from "../../../domain/repositories/IPostRepository";
// Import thực thể Domain Post để sử dụng kiểu dữ liệu Post ở tầng Domain
import { Post as DomainPost } from "../../../domain/entities/Post";
// Import model Mongoose Post từ thư mục models để truy vấn dữ liệu MongoDB
import { Post as MongoosePost } from "../../../../../models/Post";
// Import bộ chuyển đổi PostMapper để chuyển đổi qua lại giữa Domain Model và Database Document
import { PostMapper } from "./mappers/PostMapper";
// Import thư viện mongoose để thực hiện kiểm tra định dạng kiểu dữ liệu ObjectId
import mongoose from "mongoose";

/**
 * Adapter thực thi lưu trữ bài đăng (Post) và bình luận (Comment) thông qua Mongoose.
 */
export class MongoosePostRepository implements IPostRepository {
  /**
   * Tìm kiếm bài đăng theo ID.
   */
  async findById(id: string): Promise<DomainPost | null> {
    // Kiểm tra xem ID truyền vào có phải là một ObjectId hợp lệ trong MongoDB hay không
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    // Thực hiện truy vấn MongoDB để tìm tài liệu bài viết theo ID
    const doc = await MongoosePost.findById(id);
    // Nếu không tìm thấy tài liệu bài viết, trả về null
    if (!doc) return null;

    // Sử dụng PostMapper để chuyển đổi tài liệu DB vừa tìm được sang thực thể Domain Post
    return PostMapper.toDomain(doc);
  }

  /**
   * Lưu hoặc cập nhật trạng thái bài đăng.
   */
  async save(post: DomainPost): Promise<void> {
    // Chuyển đổi thực thể Domain Post sang dạng đối tượng thuần phù hợp để lưu trữ MongoDB
    const persistenceData = PostMapper.toPersistence(post);

    // Nếu bài đăng đã có ID hợp lệ trong MongoDB
    if (post.id && mongoose.Types.ObjectId.isValid(post.id)) {
      // Cập nhật tài liệu bài viết hiện có trong DB, nếu chưa có thì tự sinh mới (upsert)
      const doc = await MongoosePost.findByIdAndUpdate(
        post.id,
        { $set: persistenceData },
        { upsert: true, new: true }
      );
      // Nếu việc cập nhật thành công và trả về tài liệu mới nhất
      if (doc) {
        // Ánh xạ tài liệu mới cập nhật ngược lại về Domain để đồng bộ mảng bình luận (chứa ID được MongoDB tự sinh)
        const updated = PostMapper.toDomain(doc);
        post.props.comments = updated.comments;
      }
    } else {
      // Trường hợp tạo mới bài viết hoàn toàn
      const doc = new MongoosePost(persistenceData);
      // Thực hiện lưu tài liệu mới vào cơ sở dữ liệu MongoDB
      await doc.save();
      // Gán lại mã ID tự sinh từ MongoDB vào thực thể Domain Post
      (post as any)._id = doc._id.toString();
      // Ánh xạ ngược từ document vừa lưu để đồng bộ danh sách bình luận (nếu có)
      const updated = PostMapper.toDomain(doc);
      post.props.comments = updated.comments;
    }
  }

  /**
   * Xóa bài đăng.
   */
  async delete(post: DomainPost): Promise<void> {
    // Nếu bài đăng có ID và ID đó là một ObjectId hợp lệ trong MongoDB
    if (post.id && mongoose.Types.ObjectId.isValid(post.id)) {
      // Tiến hành xóa tài liệu bài đăng khỏi MongoDB
      await MongoosePost.findByIdAndDelete(post.id);
    }
  }
}


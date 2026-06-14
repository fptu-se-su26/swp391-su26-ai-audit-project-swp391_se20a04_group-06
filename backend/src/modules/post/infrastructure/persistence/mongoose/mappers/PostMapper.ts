// Import thực thể Domain Post để định nghĩa kiểu dữ liệu trong lớp Mapper
import { Post as DomainPost } from "../../../../domain/entities/Post";
// Import interface Mongoose Post Document để định nghĩa kiểu dữ liệu của tài liệu DB
import { IPost as MongoosePostDoc } from "../../../../../../models/Post";
// Import thư viện mongoose để thực hiện khởi tạo và ép kiểu ObjectId
import mongoose from "mongoose";

/**
 * Lớp Mapper phụ trách chuyển đổi giữa Mongoose Post Document và Domain Post Entity.
 * Giúp cho cấu trúc nghiệp vụ ở domain không bị phụ thuộc vào MongoDB.
 */
export class PostMapper {
  /**
   * Ánh xạ từ Mongoose Document sang Domain Entity.
   */
  public static toDomain(mongooseDoc: MongoosePostDoc): DomainPost {
    // Ánh xạ danh sách ID người dùng thích bài viết từ Mongoose sang kiểu chuỗi (string)
    const likes = (mongooseDoc.likes || []).map((id: any) => 
      // Kiểm tra nếu id là object chứa _id thì lấy _id.toString(), ngược lại thì lấy id.toString()
      id._id ? id._id.toString() : id.toString()
    );

    // Ánh xạ danh sách các bình luận từ tài liệu DB sang đối tượng CommentProps của Domain
    const comments = (mongooseDoc.comments || []).map((c: any) => ({
      // Chuyển ID bình luận thành chuỗi
      id: c._id ? c._id.toString() : c.id,
      // Chuyển đổi mã người bình luận sang kiểu chuỗi
      userId: c.userId.toString(),
      // Lấy tên người bình luận
      userName: c.userName,
      // Lấy ảnh đại diện người bình luận
      userAvatar: c.userAvatar,
      // Lấy nội dung bình luận
      text: c.text,
      // Lấy thời điểm tạo bình luận
      createdAt: c.createdAt,
    }));

    // Khởi tạo thực thể Domain Post mới với các thuộc tính đã qua ánh xạ
    return new DomainPost(
      {
        // Chuyển mã ID của người viết bài sang kiểu chuỗi
        userId: mongooseDoc.userId.toString(),
        // Ánh xạ tên người viết bài
        userName: mongooseDoc.userName,
        // Ánh xạ ảnh đại diện người viết bài
        userAvatar: mongooseDoc.userAvatar,
        // Ánh xạ tiêu đề bài viết
        title: mongooseDoc.title,
        // Ánh xạ nội dung bài viết
        content: mongooseDoc.content,
        // Ánh xạ mảng ảnh đính kèm (mặc định mảng rỗng nếu thiếu)
        images: mongooseDoc.images || [],
        // Ánh xạ mảng thẻ từ khóa (mặc định mảng rỗng nếu thiếu)
        tags: mongooseDoc.tags || [],
        // Gán mảng likes đã ánh xạ
        likes,
        // Gán mảng comments đã ánh xạ
        comments,
        // Ánh xạ số lượt xem bài viết (mặc định là 0 nếu thiếu)
        viewCount: mongooseDoc.viewCount || 0,
        // Ánh xạ thời điểm tạo bài viết
        createdAt: mongooseDoc.createdAt,
      },
      // Chuyển đổi mã định danh của tài liệu Mongoose từ ObjectId sang chuỗi làm ID thực thể Domain
      mongooseDoc._id.toString()
    );
  }

  /**
   * Ánh xạ từ Domain Entity sang Object lưu trữ cơ sở dữ liệu.
   */
  public static toPersistence(domainEntity: DomainPost): any {
    // Lấy ra các thuộc tính props của thực thể Domain Post
    const props = domainEntity.toProps();
    
    // Trả về đối tượng lưu trữ DB phù hợp với cấu trúc Mongoose Schema
    return {
      // Chuyển đổi ID tác giả sang định dạng ObjectId của MongoDB
      userId: new mongoose.Types.ObjectId(props.userId),
      // Thiết lập tên tác giả bài đăng
      userName: props.userName,
      // Thiết lập ảnh đại diện tác giả
      userAvatar: props.userAvatar,
      // Thiết lập tiêu đề bài đăng
      title: props.title,
      // Thiết lập nội dung bài đăng
      content: props.content,
      // Thiết lập danh sách ảnh
      images: props.images,
      // Thiết lập danh sách tags
      tags: props.tags,
      // Ánh xạ danh sách ID người thích bài đăng sang mảng các ObjectId
      likes: props.likes.map((id) => new mongoose.Types.ObjectId(id)),
      // Ánh xạ danh sách bình luận sang mảng các tài liệu con (subdocuments) MongoDB
      comments: props.comments.map((c) => ({
        // Tạo mới hoặc giữ lại ObjectId cũ của bình luận
        _id: c.id ? new mongoose.Types.ObjectId(c.id) : new mongoose.Types.ObjectId(),
        // Chuyển đổi ID người bình luận sang ObjectId
        userId: new mongoose.Types.ObjectId(c.userId),
        // Thiết lập tên người bình luận
        userName: c.userName,
        // Thiết lập ảnh đại diện người bình luận
        userAvatar: c.userAvatar,
        // Thiết lập nội dung bình luận
        text: c.text,
        // Thiết lập thời điểm tạo bình luận (nếu chưa có thì lấy thời điểm hiện tại)
        createdAt: c.createdAt || new Date(),
      })),
      // Thiết lập số lượt xem bài viết
      viewCount: props.viewCount,
    };
  }
}


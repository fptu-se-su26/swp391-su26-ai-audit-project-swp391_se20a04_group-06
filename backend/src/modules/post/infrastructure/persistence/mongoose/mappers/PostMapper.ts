import { Post as DomainPost } from "../../../../domain/entities/Post";
import { IPost as MongoosePostDoc } from "../../../../../../models/Post";
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
    const likes = (mongooseDoc.likes || []).map((id: any) => 
      id._id ? id._id.toString() : id.toString()
    );

    const comments = (mongooseDoc.comments || []).map((c: any) => ({
      id: c._id ? c._id.toString() : c.id,
      userId: c.userId.toString(),
      userName: c.userName,
      userAvatar: c.userAvatar,
      text: c.text,
      createdAt: c.createdAt,
    }));

    return new DomainPost(
      {
        userId: mongooseDoc.userId.toString(),
        userName: mongooseDoc.userName,
        userAvatar: mongooseDoc.userAvatar,
        title: mongooseDoc.title,
        content: mongooseDoc.content,
        images: mongooseDoc.images || [],
        tags: mongooseDoc.tags || [],
        likes,
        comments,
        viewCount: mongooseDoc.viewCount || 0,
        createdAt: mongooseDoc.createdAt,
      },
      mongooseDoc._id.toString()
    );
  }

  /**
   * Ánh xạ từ Domain Entity sang Object lưu trữ cơ sở dữ liệu.
   */
  public static toPersistence(domainEntity: DomainPost): any {
    const props = domainEntity.toProps();
    
    return {
      userId: new mongoose.Types.ObjectId(props.userId),
      userName: props.userName,
      userAvatar: props.userAvatar,
      title: props.title,
      content: props.content,
      images: props.images,
      tags: props.tags,
      likes: props.likes.map((id) => new mongoose.Types.ObjectId(id)),
      comments: props.comments.map((c) => ({
        _id: c.id ? new mongoose.Types.ObjectId(c.id) : new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(c.userId),
        userName: c.userName,
        userAvatar: c.userAvatar,
        text: c.text,
        createdAt: c.createdAt || new Date(),
      })),
      viewCount: props.viewCount,
    };
  }
}

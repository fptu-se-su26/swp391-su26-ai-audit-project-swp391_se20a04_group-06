import { BoatLog as DomainBoatLog } from "../../../../domain/entities/BoatLog";
import { IBoatLog as MongooseBoatLogDoc } from "../../../../../../models/BoatLog";
import mongoose from "mongoose";

/**
 * Lớp Mapper phụ trách chuyển đổi giữa Mongoose BoatLog Document và Domain BoatLog Entity.
 * Đảm bảo logic nghiệp vụ ở domain không bị pha tạp bởi thư viện lưu trữ ngoài (Mongoose).
 */
export class BoatLogMapper {
  /**
   * Ánh xạ từ Mongoose Document sang Domain Entity.
   */
  public static toDomain(mongooseDoc: MongooseBoatLogDoc): DomainBoatLog {
    const likes = (mongooseDoc.likes || []).map((id: any) => 
      id._id ? id._id.toString() : id.toString()
    );

    return new DomainBoatLog(
      {
        userId: mongooseDoc.userId.toString(),
        userName: mongooseDoc.userName,
        userAvatar: mongooseDoc.userAvatar,
        content: mongooseDoc.content,
        images: mongooseDoc.images || [],
        likes,
      },
      mongooseDoc._id.toString()
    );
  }

  /**
   * Ánh xạ từ Domain Entity sang Object lưu trữ cơ sở dữ liệu.
   */
  public static toPersistence(domainEntity: DomainBoatLog): any {
    const props = domainEntity.toProps();
    
    return {
      userId: new mongoose.Types.ObjectId(props.userId),
      userName: props.userName,
      userAvatar: props.userAvatar,
      content: props.content,
      images: props.images,
      likes: props.likes.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }
}

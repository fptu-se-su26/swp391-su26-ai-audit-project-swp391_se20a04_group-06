// Import thực thể User của tầng Domain
import { User as DomainUser } from "../../../../domain/entities/User";
// Import kiểu tài liệu IUser (Interface) của Mongoose Model ở tầng Database
import { IUser as MongooseUserDoc } from "../../../../../../models/User";
// Import thư viện Mongoose
import mongoose from "mongoose";

/**
 * LỚP MAPPING DỮ LIỆU USER (UserMapper)
 * Chịu trách nhiệm chuyển đổi cấu trúc dữ liệu qua lại giữa tầng Nghiệp vụ (Domain Entity) và tầng Cơ sở dữ liệu (Persistence Object)
 */
export class UserMapper {
  
  /**
   * CHUYỂN ĐỔI TỪ MONGOOSE DOCUMENT SANG DOMAIN ENTITY (toDomain)
   * Ánh xạ thông tin lưu trữ trong MongoDB thành một thực thể nghiệp vụ User có đầy đủ các phương thức logic
   */
  public static toDomain(mongooseDoc: MongooseUserDoc): DomainUser {
    return new DomainUser(
      {
        name: mongooseDoc.name,
        email: mongooseDoc.email,
        passwordHash: mongooseDoc.passwordHash,
        role: mongooseDoc.role,
        isActive: mongooseDoc.isActive,
        isVerified: mongooseDoc.isVerified,
        isPremium: !!mongooseDoc.isPremium,     // Đảm bảo ép kiểu boolean rõ ràng
        avatar: mongooseDoc.avatar,
        badges: mongooseDoc.badges || [],
        // Chuyển đổi mảng các ObjectId trong DB thành mảng các chuỗi string ID ở tầng Domain để độc lập với DB loại nào
        favorites: (mongooseDoc.favorites || []).map((id: any) => id.toString()),
        following: (mongooseDoc.following || []).map((id: any) => id.toString()),
      },
      mongooseDoc._id.toString()                // Gán ID thô từ MongoDB làm ID định danh của thực thể Domain
    );
  }

  /**
   * CHUYỂN ĐỔI TỪ DOMAIN ENTITY SANG PERSISTENCE OBJECT (toPersistence)
   * Ánh xạ thực thể nghiệp vụ thành một đối tượng dữ liệu trơn để lưu vào cơ sở dữ liệu MongoDB
   */
  public static toPersistence(domainEntity: DomainUser): any {
    // Lấy các thuộc tính hiện tại của thực thể miền
    const props = domainEntity.toProps();
    return {
      name: props.name,
      email: props.email,
      passwordHash: props.passwordHash,
      role: props.role,
      isActive: props.isActive,
      isVerified: props.isVerified,
      avatar: props.avatar,
      isPremium: props.isPremium,
      badges: props.badges,
      // Chuyển đổi ngược mảng ID dạng chuỗi (string) thành kiểu ObjectId của Mongoose trước khi ghi vào MongoDB
      favorites: props.favorites.map((id) => new mongoose.Types.ObjectId(id)),
      following: props.following.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }
}


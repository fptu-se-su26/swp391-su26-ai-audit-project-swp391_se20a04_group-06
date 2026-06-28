// Import giao diện IUserRepository ở tầng Domain
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
// Import thực thể miền User ở tầng Domain
import { User as DomainUser } from "../../../domain/entities/User";
// Import Mongoose Model User đại diện cho bộ dữ liệu bảng Users ở database MongoDB
import { User as MongooseUser } from "../../../../../models/User";
// Import UserMapper để ánh xạ dữ liệu qua lại giữa tầng Domain và tầng Persistence
import { UserMapper } from "./mappers/UserMapper";
// Import thư viện mongoose
import mongoose from "mongoose";

/**
 * TRIỂN KHAI INFRASTRUCTURE REPOSITORY CỦA USER BẰNG MONGOOSE (MongooseUserRepository)
 * Chứa mã nguồn thực thi giao tiếp trực tiếp với cơ sở dữ liệu MongoDB thông qua thư viện Mongoose
 */
export class MongooseUserRepository implements IUserRepository {
  
  /**
   * TÌM KIẾM NGƯỜI DÙNG THEO ID
   */
  async findById(id: string): Promise<DomainUser | null> {
    // Validate: Nếu chuỗi ID truyền vào không đúng định dạng ObjectId của MongoDB, trả về null để tránh lỗi casting
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    // Tìm kiếm trong database
    const userDoc = await MongooseUser.findById(id);
    if (!userDoc) return null;
    // Ánh xạ tài liệu database (Mongoose Document) sang thực thể miền Domain (Domain Entity)
    return UserMapper.toDomain(userDoc);
  }

  /**
   * TÌM KIẾM NGƯỜI DÙNG THEO EMAIL
   */
  async findByEmail(email: string): Promise<DomainUser | null> {
    // Tìm kiếm và tự động chuẩn hóa email trước khi truy vấn (viết thường và xóa khoảng trắng)
    const userDoc = await MongooseUser.findOne({ email: email.toLowerCase().trim() });
    if (!userDoc) return null;
    // Ánh xạ kết quả sang thực thể miền Domain
    return UserMapper.toDomain(userDoc);
  }

  /**
   * LƯU TRỮ HOẶC CẬP NHẬT THÔNG TIN NGƯỜI DÙNG (SAVE / UPSERT)
   */
  async save(user: DomainUser): Promise<void> {
    // Ánh xạ thực thể Domain sang đối tượng thuần túy sẵn sàng lưu trữ xuống MongoDB
    const persistence = UserMapper.toPersistence(user);
    
    // Nếu đối tượng đã có ID hợp lệ (trường hợp cập nhật thông tin người dùng cũ)
    if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
      // Tìm theo ID và cập nhật giá trị mới ($set). Thêm upsert: true để tự động tạo mới nếu không tìm thấy ID
      await MongooseUser.findByIdAndUpdate(user.id, { $set: persistence }, { upsert: true });
    } else {
      // Nếu chưa có ID (trường hợp đăng ký người dùng mới tinh)
      const newUserDoc = new MongooseUser(persistence);
      // Thực hiện lưu vào MongoDB
      await newUserDoc.save();
      // Gán ngược lại ID được MongoDB tự động sinh (_id) về lại cho thực thể Domain để đồng bộ thông tin
      (user as any)._id = newUserDoc._id.toString();
    }
  }

  /**
   * XÓA NGƯỜI DÙNG KHỎI CƠ SỞ DỮ LIỆU
   */
  async delete(user: DomainUser): Promise<void> {
    // Chỉ thực hiện xóa nếu ID người dùng tồn tại và đúng định dạng MongoDB
    if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
      await MongooseUser.findByIdAndDelete(user.id);
    }
  }

  /**
   * KIỂM TRA SỰ TỒN TẠI CỦA NGƯỜI DÙNG BẰNG EMAIL
   */
  async exists(email: string): Promise<boolean> {
    // Sử dụng hàm exists giúp tối ưu hiệu năng (chỉ check sự tồn tại thay vì tải toàn bộ document người dùng lên RAM)
    return !!(await MongooseUser.exists({ email: email.toLowerCase().trim() }));
  }

  /**
   * TÌM KIẾM TÀI LIỆU MONGOOSE RAW CỦA NGƯỜI DÙNG THEO ID
   */
  async findRawById(id: string): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await MongooseUser.findById(id);
  }
}


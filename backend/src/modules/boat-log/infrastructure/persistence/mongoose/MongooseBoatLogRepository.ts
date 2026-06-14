// Import giao diện IBoatLogRepository ở tầng Domain để triển khai (implement)
import { IBoatLogRepository } from "../../../domain/repositories/IBoatLogRepository";
// Import thực thể miền Domain BoatLog để làm kiểu dữ liệu trả về hoặc truyền vào
import { BoatLog as DomainBoatLog } from "../../../domain/entities/BoatLog";
// Import Mongoose model BoatLog từ thư mục models để gọi trực tiếp các lệnh truy vấn MongoDB
import { BoatLog as MongooseBoatLog } from "../../../../../models/BoatLog";
// Import lớp mapper BoatLogMapper để chuyển đổi dữ liệu qua lại giữa Mongoose và Domain
import { BoatLogMapper } from "./mappers/BoatLogMapper";
// Import thư viện mongoose để kiểm tra tính hợp lệ của định dạng ObjectId
import mongoose from "mongoose";

// Triển khai lớp MongooseBoatLogRepository thực thi tất cả các phương thức lưu trữ của IBoatLogRepository
export class MongooseBoatLogRepository implements IBoatLogRepository {
  // Phương thức bất đồng bộ tìm kiếm nhật ký cabin theo ID duy nhất
  async findById(id: string): Promise<DomainBoatLog | null> {
    // Nếu ID truyền vào không đúng định dạng ObjectId của MongoDB, trả về null ngay lập tức
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    // Tìm kiếm tài liệu document trong MongoDB bằng phương thức findById của Mongoose model
    const doc = await MongooseBoatLog.findById(id);
    // Nếu không tồn tại tài liệu nào khớp trong DB, trả về null
    if (!doc) return null;

    // Chuyển đổi tài liệu Mongoose thô tìm được thành thực thể giàu nghiệp vụ Domain BoatLog và trả về
    return BoatLogMapper.toDomain(doc);
  }

  // Phương thức bất đồng bộ lưu mới hoặc cập nhật thông tin nhật ký cabin
  async save(boatLog: DomainBoatLog): Promise<void> {
    // Chuyển đổi dữ liệu từ thực thể miền Domain thành đối tượng thô phù hợp Schema của Mongoose
    const persistenceData = BoatLogMapper.toPersistence(boatLog);

    // Nếu thực thể đã có ID hợp lệ (nghĩa là đã tồn tại trong DB, đây là hành động cập nhật)
    if (boatLog.id && mongoose.Types.ObjectId.isValid(boatLog.id)) {
      // Thực hiện tìm kiếm và cập nhật dữ liệu tài liệu hiện tại trong DB
      await MongooseBoatLog.findByIdAndUpdate(
        // Mã ID tài liệu cần cập nhật
        boatLog.id,
        // Gán đè các trường thông tin dữ liệu mới
        { $set: persistenceData },
        // Kích hoạt tính năng upsert (tạo mới nếu chưa có) và trả về tài liệu mới nhất sau khi sửa
        { upsert: true, new: true }
      );
    } else {
      // Nếu chưa có ID (đăng nhật ký mới), khởi tạo một Mongoose document mới với dữ liệu thô
      const doc = new MongooseBoatLog(persistenceData);
      // Lưu trữ tài liệu mới này xuống cơ sở dữ liệu MongoDB
      await doc.save();
      // Gán ngược mã ID dạng chuỗi sinh ra từ DB vào thuộc tính nội bộ _id của đối tượng thực thể miền
      (boatLog as any)._id = doc._id.toString();
    }
  }

  // Phương thức bất đồng bộ xóa bỏ nhật ký cabin khỏi cơ sở dữ liệu
  async delete(boatLog: DomainBoatLog): Promise<void> {
    // Nếu thực thể tồn tại ID và ID đó đúng định dạng ObjectId của MongoDB
    if (boatLog.id && mongoose.Types.ObjectId.isValid(boatLog.id)) {
      // Thực hiện lệnh tìm kiếm và xóa bỏ tài liệu khỏi DB MongoDB
      await MongooseBoatLog.findByIdAndDelete(boatLog.id);
    }
  }
}

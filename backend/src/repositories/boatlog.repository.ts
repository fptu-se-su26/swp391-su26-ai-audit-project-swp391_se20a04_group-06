// Import mô hình Mongoose BoatLog để truy vấn trực tiếp cơ sở dữ liệu MongoDB
import { BoatLog as MongooseBoatLog } from "../models/BoatLog";
// Import lớp MongooseBoatLogRepository ở tầng hạ tầng của DDD để thực thi các nghiệp vụ ghi/xóa
import { MongooseBoatLogRepository } from "../modules/boat-log/infrastructure/persistence/mongoose/MongooseBoatLogRepository";
// Import thực thể miền Domain BoatLog để khởi tạo đối tượng nghiệp vụ khi ghi dữ liệu
import { BoatLog as DomainBoatLog } from "../modules/boat-log/domain/entities/BoatLog";
// Import thư viện mongoose để kiểm định tính hợp lệ của ObjectId
import mongoose from "mongoose";

// Khởi tạo đối tượng Repository DDD quản lý lưu trữ thực thể miền Nhật ký cabin
const dddBoatLogRepository = new MongooseBoatLogRepository();

// Xuất ra đối tượng boatLogRepository đóng vai trò lớp Chống Tham Nhũng (Anti-Corruption Layer) trung gian
export const boatLogRepository = {
  // ── READ OPERATIONS (Tác vụ Đọc - Tối ưu hóa truy vấn nhanh qua Mongoose thô) ─────────────────────────

  // Lấy danh sách các nhật ký đi biển dựa trên bộ lọc, bỏ qua skip dòng và giới hạn limit dòng
  async findAll(filter: any, skip: number, limit: number) {
    // Chạy song song lệnh tìm kiếm sắp xếp theo thời gian mới nhất và đếm tổng số tài liệu khớp bộ lọc
    const [boatLogs, total] = await Promise.all([
      // Tìm tài liệu theo bộ lọc, sắp xếp thời gian giảm dần, phân trang skip và limit
      MongooseBoatLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      // Đếm số lượng tài liệu khớp bộ lọc trong bộ sưu tập
      MongooseBoatLog.countDocuments(filter),
    ]);
    // Trả về đối tượng chứa danh sách nhật ký và tổng số lượng bài nhật ký tìm thấy
    return { boatLogs, total };
  },

  // Tìm kiếm nhật ký cabin theo ID
  async findById(id: string) {
    // Nếu ID truyền vào không đúng định dạng ObjectId của MongoDB, trả về null để tránh lỗi casting
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    // Tìm kiếm tài liệu trong DB dựa theo ID
    return MongooseBoatLog.findById(id);
  },

  // Đếm số lượng tài liệu nhật ký cabin khớp với bộ lọc
  async countDocuments(filter: any): Promise<number> {
    // Gọi phương thức countDocuments của Mongoose model để đếm số bản ghi
    return MongooseBoatLog.countDocuments(filter);
  },

  // ── WRITE OPERATIONS (Tác vụ Ghi - Bắt buộc phải qua Domain Entity & Domain Repo) ────────────────────

  // Tạo mới một bản ghi nhật ký đi biển
  async create(data: {
    // ID người tạo
    userId: string;
    // Tên hiển thị người tạo
    userName: string;
    // Đường dẫn ảnh đại diện người tạo
    userAvatar: string | null;
    // Nội dung nhật ký cabin
    content: string;
    // Mảng ảnh đính kèm
    images: string[];
  }) {
    // Khởi tạo một thực thể miền Domain BoatLog mới có đầy đủ các ràng buộc nghiệp vụ miền
    const domainLog = new DomainBoatLog({
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      content: data.content,
      images: data.images,
      likes: [], // Khởi tạo mảng lượt thích trống rỗng
    });

    // Gọi repository DDD thực hiện xác thực validate và lưu thực thể miền xuống database
    await dddBoatLogRepository.save(domainLog);
    // Truy vấn lại tài liệu Mongoose thô từ database bằng ID thực thể vừa lưu để trả về cho controller cũ
    return (await MongooseBoatLog.findById(domainLog.id))!;
  },

  // Thêm lượt thích của người dùng vào bài nhật ký cabin
  async addLike(logId: string, userId: string) {
    // Tìm kiếm thực thể Domain BoatLog thông qua DDD repository để thực hiện nghiệp vụ
    const domainLog = await dddBoatLogRepository.findById(logId);
    // Nếu không tìm thấy thực thể tương ứng, trả về null
    if (!domainLog) return null;

    // Nếu người dùng này chưa từng thích nhật ký cabin này trước đó
    if (!domainLog.likes.includes(userId)) {
      // Thực hiện nghiệp vụ bật lượt thích (toggleLike)
      domainLog.toggleLike(userId);
      // Lưu lại trạng thái thay đổi của thực thể xuống cơ sở dữ liệu
      await dddBoatLogRepository.save(domainLog);
    }
    // Trả về tài liệu Mongoose thô đã cập nhật để đồng bộ API cũ
    return MongooseBoatLog.findById(logId);
  },

  // Xóa lượt thích của người dùng khỏi bài nhật ký cabin
  async removeLike(logId: string, userId: string) {
    // Tìm kiếm thực thể Domain BoatLog thông qua DDD repository
    const domainLog = await dddBoatLogRepository.findById(logId);
    // Nếu không tìm thấy thực thể tương ứng, trả về null
    if (!domainLog) return null;

    // Nếu người dùng này đã thích nhật ký cabin này từ trước
    if (domainLog.likes.includes(userId)) {
      // Thực hiện nghiệp vụ hủy lượt thích (toggleLike)
      domainLog.toggleLike(userId);
      // Lưu lại trạng thái thay đổi của thực thể xuống cơ sở dữ liệu
      await dddBoatLogRepository.save(domainLog);
    }
    // Trả về tài liệu Mongoose thô đã cập nhật
    return MongooseBoatLog.findById(logId);
  },

  // Cập nhật hàng loạt tài liệu nhật ký cabin khớp bộ lọc (phục vụ đồng bộ thông tin tác giả)
  async updateMany(filter: any, update: any) {
    // Gọi phương thức updateMany của Mongoose model để cập nhật dữ liệu hàng loạt
    return MongooseBoatLog.updateMany(filter, update);
  },

  // Xóa hàng loạt tài liệu nhật ký cabin khớp bộ lọc (phục vụ xóa tài khoản)
  async deleteMany(filter: any) {
    // Gọi phương thức deleteMany của Mongoose model để xóa hàng loạt bản ghi
    return MongooseBoatLog.deleteMany(filter);
  },

  // Xóa một nhật ký cabin theo ID
  async delete(id: string) {
    // Tìm kiếm thực thể miền của nhật ký cabin qua DDD repository
    const domainLog = await dddBoatLogRepository.findById(id);
    // Nếu thực thể miền có tồn tại trong hệ thống
    if (domainLog) {
      // Gọi repository DDD thực thi xóa bỏ vĩnh viễn thực thể miền đó
      await dddBoatLogRepository.delete(domainLog);
    }
    // Trả về true biểu thị hành động xóa kết thúc thành công
    return true;
  },
};

// Import mô hình Notification và giao diện INotification để làm việc với DB
import { Notification, INotification } from "../models/Notification";
// Import thư viện mongoose để thực hiện ép kiểu ObjectId
import mongoose from "mongoose";

// Xuất ra đối tượng quản lý truy xuất dữ liệu thông báo người dùng
export const notificationRepository = {
  // Phương thức bất đồng bộ tìm kiếm danh sách thông báo theo ID người nhận
  async findByUserId(userId: string, limit = 50): Promise<INotification[]> {
    // Truy vấn các thông báo khớp userId, sắp xếp thời gian tạo giảm dần và giới hạn số lượng thông báo trả về
    return Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
      // Sắp xếp theo ngày tạo giảm dần
      .sort({ createdAt: -1 })
      // Giới hạn số lượng thông báo nhận được (mặc định lấy tối đa 50 thông báo)
      .limit(limit);
  },

  // Phương thức bất đồng bộ truy vấn chi tiết một thông báo cụ thể của một người dùng cụ thể
  async findOne(
    // Mã ID của thông báo
    notifId: string,
    // Mã ID của người nhận
    userId: string,
  ): Promise<INotification | null> {
    // Tìm kiếm thông báo khớp cả ID thông báo và ID người dùng để bảo mật chéo thông tin
    return Notification.findOne({
      // Ép kiểu ID thông báo sang ObjectId
      _id: new mongoose.Types.ObjectId(notifId),
      // Ép kiểu ID người nhận sang ObjectId
      userId: new mongoose.Types.ObjectId(userId),
    });
  },

  // Phương thức bất đồng bộ đánh dấu Đã đọc cho toàn bộ thông báo của một người dùng
  async markAllAsRead(userId: string): Promise<any> {
    // Thực hiện cập nhật hàng loạt trường isRead thành true cho các thông báo của người dùng
    return Notification.updateMany(
      // Lọc theo ID người dùng
      { userId: new mongoose.Types.ObjectId(userId) },
      // Đặt giá trị isRead bằng true
      { $set: { isRead: true } },
    );
  },

  // Phương thức bất đồng bộ chèn hàng loạt các tài liệu thông báo mới (phục vụ gửi thông báo cho nhiều follower)
  async insertMany(
    // Mảng chứa các đối tượng thuộc tính thông báo dạng partial
    docs: Array<Partial<INotification>>,
  ): Promise<INotification[]> {
    // Gọi lệnh chèn nhiều tài liệu của Mongoose model và trả về danh sách thông báo đã chèn thành công
    return Notification.insertMany(docs) as unknown as INotification[];
  },

  // Phương thức bất đồng bộ tạo mới một tài liệu thông báo đơn lẻ
  async create(data: Partial<INotification>): Promise<INotification> {
    // Khởi tạo đối tượng tài liệu Notification mới
    const notification = new Notification(data);
    // Lưu tài liệu mới này xuống database và trả về kết quả
    return notification.save();
  },

  // Phương thức bất đồng bộ xóa toàn bộ thông báo liên quan đến một sản phẩm cụ thể (khi xóa sản phẩm)
  async deleteByProductId(productId: string): Promise<any> {
    // Thực hiện xóa hàng loạt tài liệu thông báo có productId khớp trong database
    return Notification.deleteMany({
      // Ép kiểu productId sang ObjectId để lọc khớp bản ghi quan hệ
      productId: new mongoose.Types.ObjectId(productId) as any,
    });
  },

  // Phương thức bất đồng bộ xóa toàn bộ thông báo liên quan đến một người nhận cụ thể (khi xóa tài khoản)
  async deleteByUserId(userId: string): Promise<any> {
    // Thực hiện xóa hàng loạt tài liệu thông báo có userId khớp trong database
    return Notification.deleteMany({
      // Ép kiểu userId sang ObjectId
      userId: new mongoose.Types.ObjectId(userId),
    });
  },
};

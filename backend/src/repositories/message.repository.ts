// Import thư viện mongoose để thực hiện xử lý ép kiểu dữ liệu ObjectId
import mongoose from "mongoose";
// Import mô hình Message và giao diện IMessage để tương tác cơ sở dữ liệu
import { Message, IMessage } from "../models/Message";

// Xuất ra đối tượng messageRepository chứa các phương thức xử lý cơ sở dữ liệu cho tin nhắn chat
export const messageRepository = {
  // Phương thức bất đồng bộ tạo mới một tin nhắn chat trong cơ sở dữ liệu
  async create(data: {
    // ID sản phẩm được chat làm ngữ cảnh
    productId: string;
    // ID người gửi tin nhắn
    senderId: string;
    // ID người nhận tin nhắn
    receiverId: string;
    // Nội dung văn bản tin nhắn
    content: string | null;
    // Đường dẫn ảnh gửi kèm nếu có (tùy chọn)
    imageUrl?: string | null;
    // Tọa độ địa lý và địa chỉ được chia sẻ nếu có (tùy chọn)
    location?: { latitude: number; longitude: number; address?: string } | null;
    // Thông tin tin nhắn trích dẫn/trả lời nếu có (tùy chọn)
    replyTo?: { senderId: string; content: string } | null;
  }) {
    // Khởi tạo một đối tượng tài liệu Message mới từ dữ liệu đầu vào
    const msg = new Message(data);
    // Lưu tài liệu mới này xuống cơ sở dữ liệu MongoDB
    await msg.save();
    // Trả về tài liệu tin nhắn sau khi lưu thành công
    return msg;
  },

  // Phương thức bất đồng bộ tìm kiếm danh sách tin nhắn theo bộ lọc, có cấu hình tùy chọn populate và sort
  async find(
    // Bộ lọc điều kiện tìm kiếm
    filter: any,
    // Cấu hình nạp (populate) dữ liệu bảng liên kết (tùy chọn)
    populateOpts?: any,
    // Cấu hình sắp xếp thứ tự dữ liệu trả về (tùy chọn)
    sortOpts?: any,
  ): Promise<IMessage[]> {
    // Khởi chạy câu truy vấn tìm kiếm Mongoose thô cơ bản
    let query = Message.find(filter);
    // Nếu có tùy chọn nạp dữ liệu bảng liên kết, gộp thêm .populate vào câu truy vấn
    if (populateOpts) query = query.populate(populateOpts);
    // Nếu có cấu hình sắp xếp dữ liệu, gộp thêm .sort vào câu truy vấn
    if (sortOpts) query = query.sort(sortOpts);
    // Thực thi câu truy vấn và trả về danh sách tài liệu tin nhắn
    return query;
  },

  // Phương thức bất đồng bộ tìm kiếm toàn bộ lịch sử tin nhắn trong cuộc trò chuyện giữa 2 người
  async findConversation(userId1: string, userId2: string) {
    // Tìm các tin nhắn thuộc về cặp người gửi - người nhận tương ứng
    return Message.find({
      // Sử dụng toán tử $or để lọc các tin nhắn của 2 người chat qua lại với nhau
      $or: [
        // Người 1 gửi cho người 2
        { senderId: userId1, receiverId: userId2 },
        // Hoặc người 2 gửi cho người 1
        { senderId: userId2, receiverId: userId1 },
      ],
    } as any)
      // Nạp thêm tên hiển thị của người gửi từ bộ sưu tập User
      .populate("senderId", "name")
      // Sắp xếp theo thứ tự thời gian tạo tăng dần (tin cũ xếp trước, tin mới xếp sau)
      .sort({ createdAt: 1 });
  },

  // Phương thức bất đồng bộ đánh dấu tất cả các tin nhắn là Đã đọc khi người dùng mở hộp thoại chat
  async markAsRead(fromUserId: string, toUserId: string) {
    // Cập nhật trạng thái isRead thành true hàng loạt cho các tin nhắn khớp điều kiện
    return Message.updateMany(
      {
        // Khớp ID người gửi tin nhắn (người gửi tin nhắn chưa đọc)
        senderId: fromUserId,
        // Khớp ID người nhận tin nhắn (chính người dùng đang mở hộp thoại chat)
        receiverId: toUserId,
        // Chỉ chọn những tin nhắn đang ở trạng thái chưa đọc
        isRead: false,
      } as any,
      // Cập nhật trường isRead thành true
      { $set: { isRead: true } },
    );
  },

  // Phương thức bất đồng bộ cập nhật hàng loạt tài liệu tin nhắn khớp điều kiện lọc
  async updateMany(filter: any, update: any): Promise<any> {
    // Gọi phương thức updateMany của Mongoose model
    return Message.updateMany(filter, update);
  },

  // Phương thức bất đồng bộ xóa hàng loạt tài liệu tin nhắn khớp điều kiện lọc (khi xóa tài khoản người dùng)
  async deleteMany(filter: any): Promise<any> {
    // Gọi phương thức deleteMany của Mongoose model
    return Message.deleteMany(filter);
  },

  // Phương thức bất đồng bộ đếm số lượng tài liệu tin nhắn khớp bộ lọc điều kiện
  async countDocuments(filter: any): Promise<number> {
    // Gọi phương thức countDocuments của Mongoose model
    return Message.countDocuments(filter);
  },

  // Phương thức bất đồng bộ đếm tổng số tin nhắn chưa đọc của một người nhận cụ thể
  async countUnread(receiverId: string): Promise<number> {
    // Đếm số lượng tài liệu tin nhắn có receiverId và isRead bằng false
    return Message.countDocuments({ receiverId, isRead: false } as any);
  },

  // Phương thức bất đồng bộ gộp nhóm (Aggregation) danh sách các cuộc trò chuyện gần nhất của người dùng
  async getConversationAggregation(
    // ID người dùng đang truy vấn danh sách chat
    userId: string,
    // Số dòng bỏ qua phục vụ phân trang (mặc định bằng 0)
    skip: number = 0,
    // Giới hạn số cuộc hội thoại trả về (mặc định lấy 50 cuộc)
    limit: number = 50,
  ) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];
    // Sử dụng tính năng aggregate pipeline của Mongoose để xử lý gộp nhóm phức tạp
    return Message.aggregate([
      // Bước 1: Lọc lấy các tin nhắn mà người dùng này tham gia với tư cách là người gửi hoặc người nhận
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      // Bước 2: Sắp xếp các tin nhắn theo thứ tự thời gian tạo giảm dần (tin mới nhất lên trên)
      { $sort: { createdAt: -1 } },
      // Bước 3: Gộp nhóm (Group) các tin nhắn theo cặp [otherUserId]
      {
        $group: {
          // Định danh khóa gộp nhóm _id chứa ID đối tác trò chuyện (otherUserId)
          _id: {
            // Tính toán logic otherUserId: nếu người gửi là userId hiện tại thì otherUserId là người nhận, ngược lại là người gửi
            otherUserId: {
              $cond: [
                { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
                "$receiverId",
                "$senderId",
              ],
            },
          },
          // Lấy ID sản phẩm liên quan đến tin nhắn mới nhất trong cuộc trò chuyện
          productId: { $first: "$productId" },
          // Lấy nội dung tin nhắn của tài liệu đầu tiên trong nhóm làm nội dung tin nhắn mới nhất
          lastMessage: { $first: "$content" },
          // Lấy đường dẫn ảnh tin nhắn của tài liệu đầu tiên làm ảnh tin nhắn mới nhất
          lastMessageImageUrl: { $first: "$imageUrl" },
          // Lấy vị trí địa lý của tài liệu đầu tiên làm vị trí mới nhất
          lastLocation: { $first: "$location" },
          // Lấy mốc thời gian của tài liệu đầu tiên làm mốc gửi tin nhắn cuối cùng
          lastSentAt: { $first: "$createdAt" },
          // Tính tổng số lượng tin nhắn chưa đọc trong nhóm hội thoại này
          unreadCount: {
            $sum: {
              // Sử dụng câu điều kiện: nếu isRead là false và người nhận là userId hiện tại thì cộng 1, ngược lại cộng 0
              $cond: [
                {
                  $and: [
                    { $eq: ["$isRead", false] },
                    {
                      $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      // Bước 4: Thực hiện lookup liên kết dữ liệu với bộ sưu tập 'products' để lấy thông tin sản phẩm liên quan
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      // Bước 5: Thực hiện lookup liên kết dữ liệu với bộ sưu tập 'users' để lấy thông tin của đối tác trò chuyện
      {
        $lookup: {
          from: "users",
          localField: "_id.otherUserId",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      // Bước 6: Trải phẳng mảng dữ liệu product liên kết (do lookup trả về mảng)
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      // Bước 7: Trải phẳng mảng dữ liệu otherUser liên kết
      { $unwind: { path: "$otherUser", preserveNullAndEmptyArrays: true } },
      // Bước 8: Sắp xếp lại danh sách các cuộc trò chuyện theo thời gian tin nhắn mới nhất giảm dần
      { $sort: { lastSentAt: -1 } },
      // Bước 9: Phân trang skip
      { $skip: skip },
      // Bước 10: Giới hạn số lượng cuộc trò chuyện trả về
      { $limit: limit },
    ]);
  },
};

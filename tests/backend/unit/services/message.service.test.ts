// Import đối tượng messageService cần chạy các ca kiểm thử
import { messageService } from "../../../../backend/src/services/message.service";
// Import đối tượng messageRepository để mock tác vụ lưu trữ tin nhắn
import { messageRepository } from "../../../../backend/src/repositories/message.repository";
// Import đối tượng productRepository để mock tác vụ tìm kiếm sản phẩm hải sản
import { productRepository } from "../../../../backend/src/repositories/product.repository";

// Giả lập các module repositories để tránh truy cập trực tiếp database thật
jest.mock("../../../../backend/src/repositories/message.repository");
jest.mock("../../../../backend/src/repositories/product.repository");
// Giả lập logger để tránh ghi logs hệ thống khi chạy test
jest.mock("../../../../backend/src/utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Định nghĩa nhóm kiểm thử đơn vị cho Message Service
describe("Unit Test: Message Service (message.service.ts)", () => {
  // Cấu hình ID người gửi, người nhận, và sản phẩm liên quan
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockReceiverId = "60c72b2f9b1d8b2bad000002";
  const mockProductId = "60c72b2f9b1d8b2bad000003";

  // Hàm chạy trước mỗi ca kiểm thử để dọn dẹp các mock cũ
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Nhóm kiểm thử dành cho nghiệp vụ gửi tin nhắn (sendMessage)
  describe("Nghiệp vụ sendMessage (Gửi tin nhắn)", () => {
    // Ca kiểm thử 1: Chặn gửi tin nhắn cho chính mình
    it("Nên chặn gửi tin nhắn nếu người nhận trùng với người gửi", async () => {
      // Dữ liệu tin nhắn mẫu gửi cho chính mình
      const body = {
        productId: mockProductId,
        receiverId: mockUserId, // Trùng với ID người gửi
        content: "Xin chào",
      };

      // Thực thi hàm gửi tin nhắn và kỳ vọng ném lỗi 400
      await expect(
        messageService.sendMessage(mockUserId, body),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          message: "Không thể tự gửi tin nhắn cho chính mình",
        }),
      );
    });

    // Ca kiểm thử 2: Làm sạch các thẻ HTML độc hại trong nội dung tin nhắn và tạo thành công
    it("Nên dọn dẹp thẻ HTML độc hại trong nội dung và tạo tin nhắn thành công", async () => {
      // Dữ liệu gửi từ client chứa các thẻ HTML (như <div>, <b>) và thẻ script độc hại (XSS)
      const body = {
        productId: mockProductId,
        receiverId: mockReceiverId,
        content:
          "<div>Cá thu <b>còn tươi</b> không bạn? <script>alert('xss')</script></div>",
        imageUrl: "hinh_anh_ca.png",
      };

      // Giả lập hàm create lưu trữ tin nhắn trả về bản ghi có content đã được dọn sạch
      (messageRepository.create as jest.Mock).mockResolvedValue({
        _id: "msg_123",
        content: "Cá thu còn tươi không bạn? alert('xss')",
        imageUrl: "hinh_anh_ca.png",
      });

      // Thực thi hàm gửi tin nhắn
      const result = await messageService.sendMessage(mockUserId, body);

      // Kỳ vọng kết quả trả về có ID là msg_123
      expect(result._id).toBe("msg_123");
      // Kỳ vọng repository create đã được gọi với content bị loại bỏ toàn bộ thẻ HTML thô
      expect(messageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: mockProductId,
          senderId: mockUserId,
          receiverId: mockReceiverId,
          content: "Cá thu còn tươi không bạn? alert('xss')", // Đã bị stripped hoàn toàn thẻ HTML
          imageUrl: "hinh_anh_ca.png",
        }),
      );
    });
  });
});

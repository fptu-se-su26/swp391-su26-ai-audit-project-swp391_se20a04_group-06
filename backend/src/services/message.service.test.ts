import { messageService } from "./message.service";
import { messageRepository } from "../repositories/message.repository";
import { productRepository } from "../repositories/product.repository";

// Giả lập repositories
jest.mock("../repositories/message.repository");
jest.mock("../repositories/product.repository");
jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("Unit Test: Message Service (message.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockReceiverId = "60c72b2f9b1d8b2bad000002";
  const mockProductId = "60c72b2f9b1d8b2bad000003";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Nghiệp vụ sendMessage (Gửi tin nhắn)", () => {
    it("Nên chặn gửi tin nhắn nếu người nhận trùng với người gửi", async () => {
      const body = {
        productId: mockProductId,
        receiverId: mockUserId, // Trùng với ID người gửi
        content: "Xin chào",
      };

      await expect(
        messageService.sendMessage(mockUserId, body),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          message: "Không thể tự gửi tin nhắn cho chính mình",
        }),
      );
    });

    it("Nên dọn dẹp thẻ HTML độc hại trong nội dung và tạo tin nhắn thành công", async () => {
      const body = {
        productId: mockProductId,
        receiverId: mockReceiverId,
        content:
          "<div>Cá thu <b>còn tươi</b> không bạn? <script>alert('xss')</script></div>",
        imageUrl: "hinh_anh_ca.png",
      };

      (messageRepository.create as jest.Mock).mockResolvedValue({
        _id: "msg_123",
        content: "Cá thu còn tươi không bạn? alert('xss')",
        imageUrl: "hinh_anh_ca.png",
      });

      const result = await messageService.sendMessage(mockUserId, body);

      expect(result._id).toBe("msg_123");
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

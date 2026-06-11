import { postService } from "./post.service";
import { postRepository } from "../repositories/post.repository";
import { userRepository } from "../repositories/user.repository";

// Giả lập dependencies
jest.mock("../repositories/post.repository");
jest.mock("../repositories/user.repository");
jest.mock("./badge.service", () => ({
  updateUserBadges: jest.fn().mockResolvedValue([]),
}));
jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("Unit Test: Post Service (post.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockPostId = "60c72b2f9b1d8b2bad000002";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Nghiệp vụ create (Tạo bài viết diễn đàn)", () => {
    it("Nên ném lỗi 404 nếu không tìm thấy thông tin người dùng gửi yêu cầu đăng bài", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue(null);

      const postData = {
        title: "Kinh nghiệm rà neo tránh bão",
        content:
          "Chia sẻ cho các bác đi biển đêm cách rà neo chuẩn xác để tránh bão dữ dội.",
      };

      await expect(postService.create(mockUserId, postData)).rejects.toThrow(
        expect.objectContaining({
          status: 404,
          message: "Không tìm thấy người dùng",
        }),
      );
    });

    it("Nên tạo bài viết cộng đồng thành công khi tài khoản người dùng hợp lệ", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        name: "Lão Ngư Hải Phòng",
        avatar: "img_avatar.png",
      });

      (postRepository.create as jest.Mock).mockResolvedValue({
        _id: mockPostId,
        title: "Kinh nghiệm rà neo tránh bão",
      });

      const postData = {
        title: "Kinh nghiệm rà neo tránh bão",
        content:
          "Chia sẻ cho các bác đi biển đêm cách rà neo chuẩn xác để tránh bão dữ dội.",
      };

      const result = await postService.create(mockUserId, postData);
      expect(result._id).toBe(mockPostId);
    });
  });
});

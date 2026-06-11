import { followService } from "./follow.service";
import { userRepository } from "../repositories/user.repository";

// Giả lập repository người dùng
jest.mock("../repositories/user.repository");

describe("Unit Test: Nghiệp vụ Follow Service (follow.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockSellerId = "60c72b2f9b1d8b2bad000002";
  const invalidId = "invalid_id_format";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Nên báo lỗi 400 nếu định dạng ID người bán không hợp lệ", async () => {
    await expect(
      followService.toggleFollow(mockUserId, invalidId),
    ).rejects.toThrow(
      expect.objectContaining({
        status: 400,
        message: "ID người bán không hợp lệ",
      }),
    );
  });

  it("Nên chặn không cho người dùng tự theo dõi chính bản thân", async () => {
    await expect(
      followService.toggleFollow(mockUserId, mockUserId),
    ).rejects.toThrow(
      expect.objectContaining({
        status: 400,
        message: "Không thể tự theo dõi chính mình",
      }),
    );
  });

  it("Nên tiến hành theo dõi thành công khi chưa theo dõi và người bán tồn tại", async () => {
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      _id: mockUserId,
    });
    // Giả lập chưa theo dõi
    (userRepository.isFollowing as jest.Mock).mockResolvedValue(false);
    // Giả lập người bán tồn tại và đang hoạt động tốt
    (userRepository.exists as jest.Mock).mockResolvedValue(true);

    const result = await followService.toggleFollow(mockUserId, mockSellerId);

    expect(result).toEqual({
      isFollowing: true,
      message: "Đã theo dõi thành công",
    });
    expect(userRepository.followSeller).toHaveBeenCalledWith(
      mockUserId,
      mockSellerId,
    );
  });

  it("Nên tiến hành hủy theo dõi nếu người dùng đã bấm theo dõi người bán từ trước", async () => {
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      _id: mockUserId,
    });
    // Giả lập đã theo dõi trước đó
    (userRepository.isFollowing as jest.Mock).mockResolvedValue(true);

    const result = await followService.toggleFollow(mockUserId, mockSellerId);

    expect(result).toEqual({
      isFollowing: false,
      message: "Đã hủy theo dõi",
    });
    expect(userRepository.unfollowSeller).toHaveBeenCalledWith(
      mockUserId,
      mockSellerId,
    );
  });
});

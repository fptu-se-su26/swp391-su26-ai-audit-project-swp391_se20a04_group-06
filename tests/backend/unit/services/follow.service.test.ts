// Import đối tượng followService để chạy các ca kiểm thử đơn vị
import { followService } from "../../../../backend/src/services/follow.service";
// Import đối tượng userRepository để cấu hình mock hành vi cơ sở dữ liệu người dùng
import { userRepository } from "../../../../backend/src/repositories/user.repository";

// Giả lập module userRepository để loại bỏ các tác động ghi dữ liệu thực tế
jest.mock("../../../../backend/src/repositories/user.repository");

// Định nghĩa nhóm kiểm thử đơn vị cho Follow Service
describe("Unit Test: Nghiệp vụ Follow Service (follow.service.ts)", () => {
  // Cấu hình ID người dùng, ID người bán mẫu và một ID không hợp lệ
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockSellerId = "60c72b2f9b1d8b2bad000002";
  const invalidId = "invalid_id_format";

  // Hàm chạy trước mỗi ca kiểm thử để khôi phục trạng thái mock rỗng
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Ca kiểm thử 1: Kiểm tra lỗi khi gửi ID người bán không đúng định dạng
  it("Nên báo lỗi 400 nếu định dạng ID người bán không hợp lệ", async () => {
    // Gọi hàm và kỳ vọng ném lỗi 400
    await expect(
      followService.toggleFollow(mockUserId, invalidId),
    ).rejects.toThrow(
      expect.objectContaining({
        status: 400,
        message: "ID người bán không hợp lệ",
      }),
    );
  });

  // Ca kiểm thử 2: Chặn tự theo dõi chính bản thân người dùng
  it("Nên chặn không cho người dùng tự theo dõi chính bản thân", async () => {
    // Gọi hàm tự theo dõi và kỳ vọng ném lỗi 400
    await expect(
      followService.toggleFollow(mockUserId, mockUserId),
    ).rejects.toThrow(
      expect.objectContaining({
        status: 400,
        message: "Không thể tự theo dõi chính mình",
      }),
    );
  });

  // Ca kiểm thử 3: Theo dõi người bán thành công khi chưa theo dõi từ trước và người bán tồn tại
  it("Nên tiến hành theo dõi thành công khi chưa theo dõi và người bán tồn tại", async () => {
    // Giả lập người dùng thực hiện theo dõi tồn tại
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      _id: mockUserId,
    });
    // Giả lập người dùng này chưa từng theo dõi người bán (isFollowing = false)
    (userRepository.isFollowing as jest.Mock).mockResolvedValue(false);
    // Giả lập tài khoản người bán tồn tại đang hoạt động
    (userRepository.exists as jest.Mock).mockResolvedValue(true);

    // Thực thi hàm toggleFollow
    const result = await followService.toggleFollow(mockUserId, mockSellerId);

    // Kỳ vọng kết quả trả về trạng thái theo dõi bằng true cùng thông báo thành công
    expect(result).toEqual({
      isFollowing: true,
      message: "Đã theo dõi thành công",
    });
    // Đảm bảo userRepository.followSeller đã được thực hiện với đúng tham số
    expect(userRepository.followSeller).toHaveBeenCalledWith(
      mockUserId,
      mockSellerId,
    );
  });

  // Ca kiểm thử 4: Hủy theo dõi thành công nếu người dùng đã theo dõi từ trước
  it("Nên tiến hành hủy theo dõi nếu người dùng đã bấm theo dõi người bán từ trước", async () => {
    // Giả lập người dùng tồn tại
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      _id: mockUserId,
    });
    // Giả lập trạng thái người dùng đã theo dõi người bán này (isFollowing = true)
    (userRepository.isFollowing as jest.Mock).mockResolvedValue(true);

    // Thực thi hàm toggleFollow
    const result = await followService.toggleFollow(mockUserId, mockSellerId);

    // Kỳ vọng kết quả trả về trạng thái theo dõi bằng false cùng thông báo hủy theo dõi
    expect(result).toEqual({
      isFollowing: false,
      message: "Đã hủy theo dõi",
    });
    // Đảm bảo userRepository.unfollowSeller đã được gọi để gỡ bỏ mối quan hệ theo dõi
    expect(userRepository.unfollowSeller).toHaveBeenCalledWith(
      mockUserId,
      mockSellerId,
    );
  });
});

import { favoriteService } from "./favorite.service";
import { userRepository } from "../repositories/user.repository";
import { productRepository } from "../repositories/product.repository";

// Giả lập các repositories
jest.mock("../repositories/user.repository");
jest.mock("../repositories/product.repository");

describe("Unit Test: Nghiệp vụ Favorite Service (favorite.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockProductId = "60c72b2f9b1d8b2bad000002";
  const invalidId = "invalid_id_format";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Nghiệp vụ getMyFavorites", () => {
    it("Nên báo lỗi 404 nếu không tìm thấy thông tin tài khoản người dùng", async () => {
      (userRepository.findFavoritesPopulated as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(favoriteService.getMyFavorites(mockUserId)).rejects.toThrow(
        expect.objectContaining({
          status: 404,
          message: "Không tìm thấy người dùng",
        }),
      );
    });

    it("Nên trả về danh sách mẻ hàng yêu thích đã được chuẩn hóa cấu trúc dữ liệu", async () => {
      const mockPopulatedUser = {
        _id: mockUserId,
        favorites: [
          {
            _id: mockProductId,
            name: "Tôm hùm bông",
            price: 850000,
            type: "Fresh",
            status: "Active",
            remainingWeight: 10,
            viewCount: 120,
            createdAt: new Date(),
            images: ["tom_hum.png"],
            sellerId: {
              name: "Ngư dân Trần Văn Dũng",
              isVerified: true,
            },
          },
        ],
      };

      (userRepository.findFavoritesPopulated as jest.Mock).mockResolvedValue(
        mockPopulatedUser,
      );

      const result = await favoriteService.getMyFavorites(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: mockProductId,
          name: "Tôm hùm bông",
          price: 850000,
          sellerName: "Ngư dân Trần Văn Dũng",
          sellerIsVerified: 1,
          coverImg: "tom_hum.png",
        }),
      );
    });
  });

  describe("Nghiệp vụ toggleFavorite (Bật/Tắt mẻ hàng yêu thích)", () => {
    it("Nên báo lỗi 400 nếu định dạng ID sản phẩm không hợp lệ", async () => {
      await expect(
        favoriteService.toggleFavorite(mockUserId, invalidId),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          message: "ID không hợp lệ",
        }),
      );
    });

    it("Nên tiến hành thêm vào danh sách yêu thích khi chưa lưu và sản phẩm còn hoạt động", async () => {
      // Giả lập tài khoản tồn tại và danh sách favorites hiện tại đang trống
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        favorites: [],
      });

      // Giả lập sản phẩm tồn tại và chưa bị xóa
      (productRepository.exists as jest.Mock).mockResolvedValue(true);

      const result = await favoriteService.toggleFavorite(
        mockUserId,
        mockProductId,
      );

      expect(result).toEqual({ favorited: true });
      expect(userRepository.addFavorite).toHaveBeenCalledWith(
        mockUserId,
        mockProductId,
      );
    });

    it("Nên báo lỗi 404 nếu sản phẩm không tồn tại hoặc đã bị xóa khi cố gắng lưu", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        favorites: [],
      });

      // Giả lập sản phẩm không tồn tại
      (productRepository.exists as jest.Mock).mockResolvedValue(false);

      await expect(
        favoriteService.toggleFavorite(mockUserId, mockProductId),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 404,
          message: "Sản phẩm không tồn tại hoặc đã bị xóa",
        }),
      );
    });

    it("Nên xóa khỏi danh sách yêu thích nếu sản phẩm đã được lưu từ trước", async () => {
      // Giả lập sản phẩm đã có sẵn trong mảng favorites của người dùng
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        favorites: [mockProductId], // Đã lưu trước đó
      });

      const result = await favoriteService.toggleFavorite(
        mockUserId,
        mockProductId,
      );

      expect(result).toEqual({ favorited: false });
      expect(userRepository.removeFavorite).toHaveBeenCalledWith(
        mockUserId,
        mockProductId,
      );
    });
  });
});

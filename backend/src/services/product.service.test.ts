import { productService } from "./product.service";
import { productRepository } from "../repositories/product.repository";
import { userRepository } from "../repositories/user.repository";
import { redis } from "../config/redis";

// Giả lập các dependencies
jest.mock("../repositories/product.repository");
jest.mock("../repositories/user.repository");
jest.mock("../config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  },
}));
jest.mock("./badge.service", () => ({
  updateUserBadges: jest.fn().mockResolvedValue([]),
}));
jest.mock("./notification.service", () => ({
  notifyFollowersNewProduct: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../models/User", () => {
  const mUser = {
    find: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([
      {
        _id: "60c72b2f9b1d8b2bad000001",
        name: "Seller A",
        isVerified: true,
        isPremium: true,
        badges: ["Lão ngư bám biển"],
      }
    ]),
  };
  return { User: mUser };
});

describe("Unit Test: Nghiệp vụ Product Service (product.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockProductId = "60c72b2f9b1d8b2bad000002";

  beforeEach(() => {
    jest.clearAllMocks();
    // Bỏ qua thời gian trễ của Redis
    (redis.get as jest.Mock).mockResolvedValue(null);
  });

  describe("Nghiệp vụ giới hạn đăng bài viết theo ngày", () => {
    it("Nên chặn không cho tài khoản thường đăng bài thứ 6 trong ngày", async () => {
      // Giả lập tài khoản thường (isPremium = false)
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        role: "User",
        isPremium: false,
      });

      // Giả lập hôm nay đã đăng 5 bài (lần incr tiếp theo trả về 6)
      (redis.incr as jest.Mock).mockResolvedValue(6);

      const newProductData = {
        type: "Fresh",
        category: "Fish",
        name: "Cá thu Đồ Sơn mẻ mới",
        price: 150000,
        totalWeight: 20,
        lat: 20.8449,
        lng: 106.6881,
      };

      await expect(
        productService.create(mockUserId, newProductData),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          message:
            "Tài khoản thường chỉ được phép đăng tối đa 5 bài viết mỗi ngày. Vui lòng nâng cấp lên Premium để đăng không giới hạn!",
        }),
      );
    });

    it("Nên cho phép tài khoản Premium đăng bài không giới hạn số lượng", async () => {
      // Giả lập tài khoản Premium (isPremium = true)
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        role: "User",
        isPremium: true,
      });

      // Giả lập hôm nay đã đăng 10 bài
      (redis.incr as jest.Mock).mockResolvedValue(11);

      const mockSavedProduct = { _id: mockProductId, name: "Cá hồi Sapa" };
      (productRepository.create as jest.Mock).mockResolvedValue(
        mockSavedProduct,
      );

      const newProductData = {
        type: "Fresh",
        category: "Fish",
        name: "Cá hồi Sapa",
        price: 350000,
        totalWeight: 10,
        lat: 20.8449,
        lng: 106.6881,
      };

      const result = await productService.create(mockUserId, newProductData);
      expect(result).toEqual({ productId: mockProductId });
      expect(productRepository.create).toHaveBeenCalled();
    });
  });

  describe("Nghiệp vụ đẩy tin mẻ hàng (Bump)", () => {
    it("Nên chặn nếu mẻ hàng được yêu cầu đẩy tin khi chưa đủ 24 giờ kể từ lần đẩy trước", async () => {
      const past12Hours = new Date(Date.now() - 12 * 60 * 60 * 1000); // Đã đẩy 12 giờ trước

      (productRepository.findById as jest.Mock).mockResolvedValue({
        _id: mockProductId,
        sellerId: mockUserId,
        type: "Fresh",
        bumpedAt: past12Hours,
      });

      (productRepository.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        productService.bump(mockProductId, mockUserId),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 429,
          message: expect.stringContaining("đẩy tin lại sau"),
        }),
      );
    });

    it("Nên cho phép đẩy tin thành công nếu lần đẩy trước đã cách hơn 24 giờ", async () => {
      const past30Hours = new Date(Date.now() - 30 * 60 * 60 * 1000); // Đã đẩy 30 giờ trước

      (productRepository.findById as jest.Mock).mockResolvedValue({
        _id: mockProductId,
        sellerId: mockUserId,
        type: "Fresh",
        bumpedAt: past30Hours,
      });

      (productRepository.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await expect(
        productService.bump(mockProductId, mockUserId),
      ).resolves.not.toThrow();
      expect(productRepository.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({ bumpedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("Nghiệp vụ truy vấn sản phẩm theo GPS địa lý", () => {
    it("Nên áp dụng bộ lọc $geoWithin khi truy vấn sản phẩm loại Fresh với lat và lng hợp lệ", async () => {
      (productRepository.countDocuments as jest.Mock).mockResolvedValue(1);
      (productRepository.find as jest.Mock).mockResolvedValue([
        {
          _id: mockProductId,
          sellerId: mockUserId,
          type: "Fresh",
          name: "Cá thu Đồ Sơn",
          location: { coordinates: [106.6881, 20.8449] },
        },
      ]);
      (userRepository.find as jest.Mock).mockResolvedValue([
        { _id: mockUserId, name: "Seller A" }
      ]);

      await productService.list({
        type: "Fresh",
        lat: "20.8449",
        lng: "106.6881",
      });

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Fresh",
          location: expect.objectContaining({
            $geoWithin: expect.objectContaining({
              $centerSphere: expect.any(Array),
            }),
          }),
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("Không nên áp dụng bộ lọc GPS nếu loại sản phẩm không phải là Fresh", async () => {
      (productRepository.countDocuments as jest.Mock).mockResolvedValue(0);
      (productRepository.find as jest.Mock).mockResolvedValue([]);
      (userRepository.find as jest.Mock).mockResolvedValue([]);

      await productService.list({
        type: "Dried",
        lat: "20.8449",
        lng: "106.6881",
      });

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.not.objectContaining({
          location: expect.any(Object),
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});
